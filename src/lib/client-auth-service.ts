// Client-side authentication service
// This service handles authentication on the client side without JWT dependencies

export interface ClientSessionInfo {
  isAuthenticated: boolean
  userId?: string
  email?: string
  isTokenExpired?: boolean
}

export class ClientAuthService {
  /**
   * Check if user is authenticated by checking for access token in cookies
   */
  isAuthenticated(): boolean {
    if (typeof document === 'undefined') return false
    
    const cookies = document.cookie.split(';')
    const accessToken = cookies.find(cookie => 
      cookie.trim().startsWith('access_token=')
    )
    
    return !!accessToken
  }

  /**
   * Get session info from cookies (client-side only)
   */
  getSessionInfo(): ClientSessionInfo {
    if (typeof document === 'undefined') {
      return { isAuthenticated: false }
    }

    const cookies = document.cookie.split(';')
    const accessToken = cookies.find(cookie => 
      cookie.trim().startsWith('access_token=')
    )
    const refreshToken = cookies.find(cookie => 
      cookie.trim().startsWith('refresh_token=')
    )

    return {
      isAuthenticated: !!accessToken,
      isTokenExpired: !accessToken && !!refreshToken // If we have refresh but no access, token is expired
    }
  }

  /**
   * Clear authentication cookies (client-side)
   */
  clearAuthCookies(): void {
    if (typeof document === 'undefined') return

    // Clear access token
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; HttpOnly; Secure; SameSite=strict'
    
    // Clear refresh token
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; HttpOnly; Secure; SameSite=strict'
  }

  /**
   * Refresh session by calling the server-side API
   */
  async refreshSession(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (response.ok) {
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error refreshing session:', error)
      return false
    }
  }

  /**
   * Sign out by calling the server-side API
   */
  async signOut(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        this.clearAuthCookies()
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error signing out:', error)
      return false
    }
  }
}

export const clientAuthService = new ClientAuthService()
