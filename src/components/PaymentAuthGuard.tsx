"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Shield, LogIn, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PaymentAuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * Payment Authentication Guard
 * Ensures only authenticated users can access payment-related components
 */
export function PaymentAuthGuard({ 
  children, 
  fallback, 
  redirectTo = '/auth' 
}: PaymentAuthGuardProps) {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state while checking authentication
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // User not authenticated
  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <Shield className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-xl">Authentication Required</CardTitle>
          <CardDescription>
            You need to sign in to access payment features and manage your subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
            <AlertTriangle className="h-4 w-4" />
            <span>Payment features are only available to signed-in users.</span>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={() => router.push(redirectTo)}
              className="w-full"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In to Continue
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // User is authenticated, render children
  return <>{children}</>
}

/**
 * Hook to check if user can make payments
 */
export function usePaymentAuth() {
  const { user, loading } = useAuth()
  const [canMakePayment, setCanMakePayment] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      // Additional checks can be added here
      // For example: check if user is not banned, has valid email, etc.
      setCanMakePayment(true)
    } else {
      setCanMakePayment(false)
    }
  }, [user, loading])

  return {
    canMakePayment,
    user,
    loading,
    isAuthenticated: !!user
  }
}

/**
 * Payment Button with Authentication Check
 */
interface SecurePaymentButtonProps {
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export function SecurePaymentButton({ 
  onClick, 
  children, 
  disabled = false, 
  className = "" 
}: SecurePaymentButtonProps) {
  const { canMakePayment, isAuthenticated } = usePaymentAuth()
  const router = useRouter()

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }
    
    if (!canMakePayment) {
      return
    }
    
    onClick()
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || !canMakePayment}
      className={className}
    >
      {children}
    </Button>
  )
}
