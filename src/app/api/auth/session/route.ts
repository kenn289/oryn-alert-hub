import { NextRequest, NextResponse } from 'next/server'
import { authSessionService } from '../../../../lib/auth-session-service'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export async function POST(request: NextRequest) {
  try {
    const { action, refreshToken } = await request.json()

    if (action === 'refresh') {
      if (!refreshToken) {
        return NextResponse.json({ error: 'Refresh token required' }, { status: 400 })
      }

      const newTokens = await authSessionService.refreshAccessToken(refreshToken)
      
      if (!newTokens) {
        return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
      }

      const response = NextResponse.json({
        success: true,
        accessToken: newTokens.accessToken,
        expiresAt: newTokens.expiresAt
      })

      // Set secure cookies
      authSessionService.setSecureCookies(response, newTokens)

      return response
    }

    if (action === 'revoke') {
      if (!refreshToken) {
        return NextResponse.json({ error: 'Refresh token required' }, { status: 400 })
      }

      const success = await authSessionService.revokeRefreshToken(refreshToken)
      
      if (!success) {
        return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 })
      }

      const response = NextResponse.json({ success: true })
      
      // Clear authentication cookies
      authSessionService.clearAuthCookies(response)

      return response
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Session management error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookies
    const accessToken = request.cookies.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 })
    }

    // Verify access token
    const tokenData = authSessionService.verifyAccessToken(accessToken)
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 })
    }

    // Get user data from Supabase
    const { data: user, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.user.id,
        email: user.user.email,
        ...tokenData
      }
    })

  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
