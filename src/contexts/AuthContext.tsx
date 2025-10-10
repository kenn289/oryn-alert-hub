"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import { UserInitializationService } from "../lib/user-initialization-service"
import { UnifiedSyncService } from "../lib/unified-sync-service"
import { authSessionService } from "../lib/auth-session-service"

interface AuthContextType {
  user: User | null
  session: Session | null
  signOut: () => Promise<void>
  loading: boolean
  isTokenExpired: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signOut: async () => {},
  loading: true,
  isTokenExpired: false,
  refreshSession: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTokenExpired, setIsTokenExpired] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        // Handle new user initialization (non-blocking) - only on client side
        if (event === 'SIGNED_IN' && session?.user && typeof window !== 'undefined') {
          // Skip user initialization for master account to avoid issues
          if (session.user.email === 'kennethoswin289@gmail.com') {
            console.log('🛡️ Master account detected, skipping user initialization')
          } else {
            // Don't await this - let it run in background
            UserInitializationService.userExists(session.user.id)
              .then(async (userExists) => {
                if (!userExists) {
                  console.log('🆕 New user detected, initializing...')
                  await UserInitializationService.initializeNewUser(
                    session.user.id, 
                    session.user.email || ''
                  )
                } else {
                  // Update last login for existing users
                  await UserInitializationService.updateLastLogin(session.user.id)
                }
                // Unified sync after user initialization
                try {
                  console.log('🔄 Running unified data sync (watchlist + portfolio)')
                  await UnifiedSyncService.unifyAll(session.user.id)
                  console.log('✅ Unified data sync complete')
                } catch (syncError) {
                  console.error('Unified sync error:', syncError)
                }
              })
              .catch(error => {
                console.error('Error handling user initialization:', error)
              })
          }
        }
        
        setLoading(false)
      }
    )

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Handle existing session - only on client side
      if (session?.user && typeof window !== 'undefined') {
        try {
          // Skip user initialization for master account to avoid issues
          if (session.user.email === 'kennethoswin289@gmail.com') {
            console.log('🛡️ Master account detected, skipping user initialization')
          } else {
            const userExists = await UserInitializationService.userExists(session.user.id)
            
            if (!userExists) {
              console.log('🆕 Existing session with new user, initializing...')
              await UserInitializationService.initializeNewUser(
                session.user.id, 
                session.user.email || ''
              )
            } else {
              // Update last login for existing users
              await UserInitializationService.updateLastLogin(session.user.id)
            }
          }
          // Always run unified sync on session restore
          try {
            console.log('🔄 Running unified data sync on session restore')
            await UnifiedSyncService.unifyAll(session.user.id)
            console.log('✅ Unified data sync complete')
          } catch (syncError) {
            console.error('Unified sync error:', syncError)
          }
        } catch (error) {
          console.error('Error handling session initialization:', error)
        }
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const refreshSession = async () => {
    try {
      // Get refresh token from cookies
      const refreshToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('refresh_token='))
        ?.split('=')[1]

      if (!refreshToken) {
        setIsTokenExpired(true)
        return
      }

      // Try to refresh the access token
      const newTokens = await authSessionService.refreshAccessToken(refreshToken)
      
      if (newTokens) {
        // Update cookies with new tokens
        document.cookie = `access_token=${newTokens.accessToken}; path=/; secure; samesite=strict; max-age=${60 * 60}`
        document.cookie = `refresh_token=${newTokens.refreshToken}; path=/; secure; samesite=strict; max-age=${7 * 24 * 60 * 60}`
        
        setIsTokenExpired(false)
        console.log('✅ Session refreshed successfully')
      } else {
        setIsTokenExpired(true)
        console.log('❌ Failed to refresh session')
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      setIsTokenExpired(true)
    }
  }

  const signOut = async () => {
    try {
      // Get refresh token from cookies
      const refreshToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('refresh_token='))
        ?.split('=')[1]

      // Revoke refresh token if exists
      if (refreshToken) {
        await authSessionService.revokeRefreshToken(refreshToken)
      }

      // Preserve important user data before clearing storage
      const portfolioData = localStorage.getItem('oryn_portfolio')
      const watchlistData = localStorage.getItem('oryn_watchlist')
      const watchlistChecksum = localStorage.getItem('oryn_watchlist_checksum')
      const userPlan = localStorage.getItem('oryn_user_plan')
      const currencyPreference = localStorage.getItem('oryn_currency_preference')
      
      // Clear all sessions and local storage
      await supabase.auth.signOut()
      
      // Clear authentication cookies
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      
      // Clear any cached data
      localStorage.clear()
      sessionStorage.clear()
      
      // Restore preserved user data
      if (portfolioData) {
        localStorage.setItem('oryn_portfolio', portfolioData)
      }
      if (watchlistData) {
        localStorage.setItem('oryn_watchlist', watchlistData)
      }
      if (watchlistChecksum) {
        localStorage.setItem('oryn_watchlist_checksum', watchlistChecksum)
      }
      if (userPlan) {
        localStorage.setItem('oryn_user_plan', userPlan)
      }
      if (currencyPreference) {
        localStorage.setItem('oryn_currency_preference', currencyPreference)
      }
      
      // Reset state
      setUser(null)
      setSession(null)
      setIsTokenExpired(false)
      
      // Force reload to clear any remaining state
      window.location.reload()
    } catch (error) {
      console.error('Error during sign out:', error)
      // Force reload even if there's an error
      window.location.reload()
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, signOut, loading, isTokenExpired, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}
