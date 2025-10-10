import { NextRequest, NextResponse } from 'next/server'
import { authSessionService } from '../lib/auth-session-service'

export interface AuthMiddlewareOptions {
  requireAuth?: boolean
  allowedRoles?: string[]
  redirectToLogin?: boolean
}

export async function authMiddleware(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<NextResponse | null> {
  const {
    requireAuth = true,
    allowedRoles = [],
    redirectToLogin = true
  } = options

  // Skip auth for public routes
  if (!requireAuth) {
    return null
  }

  // Get access token from cookies
  const accessToken = request.cookies.get('access_token')?.value

  if (!accessToken) {
    if (redirectToLogin) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Verify access token
  const tokenData = authSessionService.verifyAccessToken(accessToken)
  
  if (!tokenData) {
    // Try to refresh the token
    const refreshToken = request.cookies.get('refresh_token')?.value
    
    if (refreshToken) {
      const newTokens = await authSessionService.refreshAccessToken(refreshToken)
      
      if (newTokens) {
        // Create response with new tokens
        const response = NextResponse.next()
        
        // Set new cookies
        response.cookies.set('access_token', newTokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 // 1 hour
        })
        
        response.cookies.set('refresh_token', newTokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        })
        
        // Add user info to headers for the request
        response.headers.set('x-user-id', tokenData.userId)
        response.headers.set('x-user-email', tokenData.email)
        
        return response
      }
    }
    
    // If refresh fails, redirect to login
    if (redirectToLogin) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  // Check role-based access if specified
  if (allowedRoles.length > 0) {
    // This would need to be implemented based on your user role system
    // For now, we'll assume all authenticated users have access
    // You can extend this to check against user roles from the database
  }

  // Add user info to headers for the request
  const response = NextResponse.next()
  response.headers.set('x-user-id', tokenData.userId)
  response.headers.set('x-user-email', tokenData.email)
  
  return response
}

export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
  return async (request: NextRequest) => {
    return await authMiddleware(request, options)
  }
}
