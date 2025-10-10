import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// Lazy initialization of Supabase client
let supabase: any = null

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
    
    supabase = createClient(supabaseUrl, supabaseKey)
  }
  
  return supabase
}

export interface SessionTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface RefreshTokenPayload {
  userId: string
  email: string
  tokenId: string
  iat: number
  exp: number
}

export class AuthSessionService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
  private readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-super-secret-refresh-key-change-this-in-production'
  private readonly ACCESS_TOKEN_EXPIRY = '1h' // 1 hour
  private readonly REFRESH_TOKEN_EXPIRY = '7d' // 7 days
  private readonly COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

  /**
   * Generate secure session tokens
   */
  async generateSessionTokens(userId: string, email: string): Promise<SessionTokens> {
    try {
      // Generate unique token ID for refresh token tracking
      const tokenId = crypto.randomUUID()
      
      // Create access token (short-lived)
      const accessToken = jwt.sign(
        { 
          userId, 
          email, 
          type: 'access',
          iat: Math.floor(Date.now() / 1000)
        },
        this.JWT_SECRET,
        { expiresIn: this.ACCESS_TOKEN_EXPIRY }
      )

      // Create refresh token (long-lived with tracking)
      const refreshToken = jwt.sign(
        { 
          userId, 
          email, 
          tokenId,
          type: 'refresh',
          iat: Math.floor(Date.now() / 1000)
        },
        this.REFRESH_TOKEN_SECRET,
        { expiresIn: this.REFRESH_TOKEN_EXPIRY }
      )

      // Store refresh token in database for tracking and revocation
      await this.storeRefreshToken(userId, tokenId, refreshToken)

      // Calculate expiration time
      const expiresAt = Date.now() + (60 * 60 * 1000) // 1 hour from now

      return {
        accessToken,
        refreshToken,
        expiresAt
      }
    } catch (error) {
      console.error('Error generating session tokens:', error)
      throw new Error('Failed to generate session tokens')
    }
  }

  /**
   * Store refresh token in database for tracking
   */
  private async storeRefreshToken(userId: string, tokenId: string, refreshToken: string): Promise<void> {
    try {
      const client = getSupabaseClient()
      const { error } = await client
        .from('refresh_tokens')
        .insert({
          user_id: userId,
          token_id: tokenId,
          token_hash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error storing refresh token:', error)
        throw error
      }
    } catch (error) {
      console.error('Error storing refresh token:', error)
      throw error
    }
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any
      
      if (decoded.type !== 'access') {
        return null
      }

      return {
        userId: decoded.userId,
        email: decoded.email
      }
    } catch (error) {
      console.error('Error verifying access token:', error)
      return null
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<SessionTokens | null> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.REFRESH_TOKEN_SECRET) as RefreshTokenPayload
      
      if (decoded.type !== 'refresh') {
        return null
      }

      // Check if refresh token exists in database and is not revoked
      const client = getSupabaseClient()
      const { data: tokenData, error } = await client
        .from('refresh_tokens')
        .select('*')
        .eq('user_id', decoded.userId)
        .eq('token_id', decoded.tokenId)
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !tokenData) {
        console.error('Refresh token not found or expired:', error)
        return null
      }

      // Verify token hash
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
      if (tokenHash !== tokenData.token_hash) {
        console.error('Refresh token hash mismatch')
        return null
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        { 
          userId: decoded.userId, 
          email: decoded.email, 
          type: 'access',
          iat: Math.floor(Date.now() / 1000)
        },
        this.JWT_SECRET,
        { expiresIn: this.ACCESS_TOKEN_EXPIRY }
      )

      // Update last used timestamp
      await client
        .from('refresh_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('token_id', decoded.tokenId)

      return {
        accessToken: newAccessToken,
        refreshToken, // Keep the same refresh token
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour from now
      }
    } catch (error) {
      console.error('Error refreshing access token:', error)
      return null
    }
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(refreshToken, this.REFRESH_TOKEN_SECRET) as RefreshTokenPayload
      
      if (decoded.type !== 'refresh') {
        return false
      }

      // Mark token as revoked
      const client = getSupabaseClient()
      const { error } = await client
        .from('refresh_tokens')
        .update({ 
          is_revoked: true,
          revoked_at: new Date().toISOString()
        })
        .eq('user_id', decoded.userId)
        .eq('token_id', decoded.tokenId)

      return !error
    } catch (error) {
      console.error('Error revoking refresh token:', error)
      return false
    }
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllRefreshTokens(userId: string): Promise<boolean> {
    try {
      const client = getSupabaseClient()
      const { error } = await client
        .from('refresh_tokens')
        .update({ 
          is_revoked: true,
          revoked_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_revoked', false)

      return !error
    } catch (error) {
      console.error('Error revoking all refresh tokens:', error)
      return false
    }
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const client = getSupabaseClient()
      await client
        .from('refresh_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString())
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error)
    }
  }

  /**
   * Get secure cookie options
   */
  getSecureCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: this.COOKIE_MAX_AGE,
      path: '/'
    }
  }

  /**
   * Set secure cookies for tokens
   */
  setSecureCookies(response: Response, tokens: SessionTokens): void {
    const cookieOptions = this.getSecureCookieOptions()
    
    // Set access token cookie
    response.headers.set(
      'Set-Cookie',
      `access_token=${tokens.accessToken}; ${this.formatCookieOptions(cookieOptions)}`
    )
    
    // Set refresh token cookie
    response.headers.set(
      'Set-Cookie',
      `refresh_token=${tokens.refreshToken}; ${this.formatCookieOptions(cookieOptions)}`
    )
  }

  /**
   * Clear authentication cookies
   */
  clearAuthCookies(response: Response): void {
    const cookieOptions = this.getSecureCookieOptions()
    
    // Clear access token cookie
    response.headers.set(
      'Set-Cookie',
      `access_token=; ${this.formatCookieOptions({ ...cookieOptions, maxAge: 0 })}`
    )
    
    // Clear refresh token cookie
    response.headers.set(
      'Set-Cookie',
      `refresh_token=; ${this.formatCookieOptions({ ...cookieOptions, maxAge: 0 })}`
    )
  }

  /**
   * Format cookie options for Set-Cookie header
   */
  private formatCookieOptions(options: any): string {
    const parts = []
    
    if (options.httpOnly) parts.push('HttpOnly')
    if (options.secure) parts.push('Secure')
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`)
    if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`)
    if (options.path) parts.push(`Path=${options.path}`)
    
    return parts.join('; ')
  }
}

export const authSessionService = new AuthSessionService()
