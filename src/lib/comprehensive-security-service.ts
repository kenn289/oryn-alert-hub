import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { NextRequest } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export interface SecurityConfig {
  rateLimitWindow: number
  rateLimitMax: number
  maxLoginAttempts: number
  lockoutDuration: number
  sessionTimeout: number
  passwordMinLength: number
  requireSpecialChars: boolean
  requireNumbers: boolean
  requireUppercase: boolean
  enable2FA: boolean
  enableIPWhitelist: boolean
  enableDeviceFingerprinting: boolean
  enableGeolocation: boolean
  enableBehavioralAnalysis: boolean
}

export interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'suspicious_activity' | 'rate_limit_exceeded' | 'security_violation'
  userId?: string
  userEmail?: string
  ipAddress: string
  userAgent: string
  deviceFingerprint?: string
  geolocation?: {
    country: string
    region: string
    city: string
    latitude: number
    longitude: number
  }
  riskScore: number
  details: string
  metadata?: any
}

export interface RateLimitInfo {
  count: number
  resetTime: number
  isBlocked: boolean
}

export class ComprehensiveSecurityService {
  private config: SecurityConfig

  constructor() {
    this.config = {
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60') * 1000,
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '60'),
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '15') * 60 * 1000,
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '24') * 60 * 60 * 1000,
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      requireSpecialChars: process.env.REQUIRE_SPECIAL_CHARS === 'true',
      requireNumbers: process.env.REQUIRE_NUMBERS === 'true',
      requireUppercase: process.env.REQUIRE_UPPERCASE === 'true',
      enable2FA: process.env.ENABLE_2FA === 'true',
      enableIPWhitelist: process.env.ENABLE_IP_WHITELIST === 'true',
      enableDeviceFingerprinting: process.env.ENABLE_DEVICE_FINGERPRINTING === 'true',
      enableGeolocation: process.env.ENABLE_GEOLOCATION === 'true',
      enableBehavioralAnalysis: process.env.ENABLE_BEHAVIORAL_ANALYSIS === 'true'
    }
  }

  /**
   * Check rate limiting for a given IP address
   */
  async checkRateLimit(ipAddress: string, endpoint: string): Promise<RateLimitInfo> {
    try {
      const key = `rate_limit:${ipAddress}:${endpoint}`
      const now = Date.now()
      
      // Get current rate limit data
      const { data: existing } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('ip_address', ipAddress)
        .eq('endpoint', endpoint)
        .single()

      if (!existing) {
        // First request
        await supabase.from('rate_limits').insert({
          ip_address: ipAddress,
          endpoint,
          count: 1,
          first_request: new Date().toISOString(),
          last_request: new Date().toISOString()
        })
        
        return {
          count: 1,
          resetTime: now + this.config.rateLimitWindow,
          isBlocked: false
        }
      }

      const timeDiff = now - new Date(existing.first_request).getTime()
      
      if (timeDiff >= this.config.rateLimitWindow) {
        // Reset window
        await supabase.from('rate_limits').update({
          count: 1,
          first_request: new Date().toISOString(),
          last_request: new Date().toISOString()
        }).eq('id', existing.id)
        
        return {
          count: 1,
          resetTime: now + this.config.rateLimitWindow,
          isBlocked: false
        }
      }

      if (existing.count >= this.config.rateLimitMax) {
        // Rate limit exceeded
        await this.logSecurityEvent({
          type: 'rate_limit_exceeded',
          ipAddress,
          userAgent: 'Unknown',
          riskScore: 0.8,
          details: `Rate limit exceeded for ${endpoint}`,
          metadata: { endpoint, count: existing.count }
        })
        
        return {
          count: existing.count,
          resetTime: new Date(existing.first_request).getTime() + this.config.rateLimitWindow,
          isBlocked: true
        }
      }

      // Increment count
      await supabase.from('rate_limits').update({
        count: existing.count + 1,
        last_request: new Date().toISOString()
      }).eq('id', existing.id)

      return {
        count: existing.count + 1,
        resetTime: new Date(existing.first_request).getTime() + this.config.rateLimitWindow,
        isBlocked: false
      }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      return {
        count: 0,
        resetTime: Date.now() + this.config.rateLimitWindow,
        isBlocked: false
      }
    }
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < this.config.passwordMinLength) {
      errors.push(`Password must be at least ${this.config.passwordMinLength} characters long`)
    }
    
    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (this.config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (this.config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Check for suspicious login patterns
   */
  async checkSuspiciousActivity(userId: string, ipAddress: string, userAgent: string): Promise<number> {
    try {
      let riskScore = 0
      
      // Check for multiple IP addresses
      const { data: ipHistory } = await supabase
        .from('security_events')
        .select('ip_address')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      
      const uniqueIPs = new Set(ipHistory?.map(event => event.ip_address) || [])
      if (uniqueIPs.size > 3) {
        riskScore += 0.3
      }
      
      // Check for rapid login attempts
      const { data: recentAttempts } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'login_attempt')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      
      if (recentAttempts && recentAttempts.length > 10) {
        riskScore += 0.4
      }
      
      // Check for unusual user agent
      const { data: userAgentHistory } = await supabase
        .from('security_events')
        .select('user_agent')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      
      const hasSeenUserAgent = userAgentHistory?.some(event => event.user_agent === userAgent)
      if (!hasSeenUserAgent) {
        riskScore += 0.2
      }
      
      return Math.min(riskScore, 1.0)
    } catch (error) {
      console.error('Suspicious activity check failed:', error)
      return 0.1
    }
  }

  /**
   * Log security events
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await supabase.from('security_events').insert({
        type: event.type,
        user_id: event.userId,
        user_email: event.userEmail,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        device_fingerprint: event.deviceFingerprint,
        geolocation: event.geolocation,
        risk_score: event.riskScore,
        details: event.details,
        metadata: event.metadata,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  /**
   * Generate secure API key
   */
  generateAPIKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Hash sensitive data
   */
  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string, key: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', key)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string, key: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', key)
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  /**
   * Validate API key
   */
  async validateAPIKey(apiKey: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const { data: keyData } = await supabase
        .from('api_keys')
        .select('user_id, expires_at, is_active')
        .eq('key_hash', this.hashData(apiKey))
        .single()
      
      if (!keyData || !keyData.is_active) {
        return { valid: false }
      }
      
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        return { valid: false }
      }
      
      return { valid: true, userId: keyData.user_id }
    } catch (error) {
      console.error('API key validation failed:', error)
      return { valid: false }
    }
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(): Promise<any> {
    try {
      const [
        { data: recentEvents },
        { data: rateLimits },
        { data: securityViolations },
        { data: fraudAttempts }
      ] = await Promise.all([
        supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('rate_limits').select('*').order('last_request', { ascending: false }).limit(50),
        supabase.from('security_violations').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('fraud_attempts').select('*').order('created_at', { ascending: false }).limit(50)
      ])
      
      return {
        recentEvents: recentEvents || [],
        rateLimits: rateLimits || [],
        securityViolations: securityViolations || [],
        fraudAttempts: fraudAttempts || []
      }
    } catch (error) {
      console.error('Failed to get security dashboard data:', error)
      return {
        recentEvents: [],
        rateLimits: [],
        securityViolations: [],
        fraudAttempts: []
      }
    }
  }
}
