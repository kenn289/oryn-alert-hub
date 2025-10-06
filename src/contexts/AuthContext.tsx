"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { UserInitializationService } from "@/lib/user-initialization-service"

interface AuthContextType {
  user: User | null
  session: Session | null
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signOut: async () => {},
  loading: true,
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
        } catch (error) {
          console.error('Error handling session initialization:', error)
        }
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    // Preserve important user data before clearing storage
    const portfolioData = localStorage.getItem('oryn_portfolio')
    const watchlistData = localStorage.getItem('oryn_watchlist')
    const watchlistChecksum = localStorage.getItem('oryn_watchlist_checksum')
    const userPlan = localStorage.getItem('oryn_user_plan')
    const currencyPreference = localStorage.getItem('oryn_currency_preference')
    
    // Clear all sessions and local storage
    await supabase.auth.signOut()
    
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
    
    // Force reload to clear any remaining state
    window.location.reload()
  }

  return (
    <AuthContext.Provider value={{ user, session, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
