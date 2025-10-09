import { createClient } from '@supabase/supabase-js'

export interface PaymentOrder {
  orderId: string
  amount: number
  currency: string
  key: string
  mock?: boolean
}

export interface PaymentVerification {
  success: boolean
  message: string
  subscription?: {
    plan: string
    trial: boolean
    trialEndsAt: string
  }
}

export interface UserSubscription {
  id: string
  user_id: string
  plan: string
  status: string
  trial: boolean
  trial_ends_at?: string
  created_at: string
  updated_at: string
}

export class PaymentService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
  )

  /**
   * Create a secure payment order
   */
  async createPaymentOrder(plan: string, userId: string, userEmail: string): Promise<PaymentOrder> {
    try {
      const response = await fetch('/api/razorpay/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          userId,
          userEmail
        })
      })

      if (!response.ok) {
        let error
        try {
          const responseText = await response.text()
          
          if (responseText.trim()) {
            error = JSON.parse(responseText)
          } else {
            error = { error: 'Empty response from payment service' }
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          error = { error: 'Invalid response from payment service' }
        }
        
        console.error('Payment API error:', error)
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error(error.error || 'Authentication required. Please sign in to make payments.')
        } else if (response.status === 400) {
          throw new Error(error.error || 'Invalid payment request. Please check your details.')
        } else if (response.status === 409) {
          throw new Error(error.error || 'You already have a pending payment. Please complete or cancel it first.')
        } else {
          throw new Error(error.error || 'Payment service is temporarily unavailable. Please try again later.')
        }
      }

      return await response.json()
    } catch (error) {
      console.error('Payment order creation failed:', error)
      
      // Re-throw specific errors from the API
      if (error instanceof Error && (
        error.message.includes('Authentication required') ||
        error.message.includes('Invalid user credentials') ||
        error.message.includes('Please sign in')
      )) {
        throw error
      } else if (error instanceof Error && error.message.includes('pending payment')) {
        throw error
      } else if (error instanceof Error && error.message.includes('Invalid payment request')) {
        throw error
      }
      
      // Generic fallback for network or other errors
      throw new Error('Payment service is currently unavailable. Please try again later or contact support.')
    }
  }

  /**
   * Verify payment and activate subscription
   */
  async verifyPayment(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
    userId: string,
    userEmail: string
  ): Promise<PaymentVerification> {
    try {
      const response = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          userId,
          userEmail
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Payment verification failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Payment verification failed:', error)
      throw new Error('Payment verification failed. Please contact support.')
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No subscription found
      }
      
      // Check if it's a table not found error
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        console.warn('Subscriptions table not found, returning null')
        return null
      }
      
      console.error('Error fetching subscription:', error)
      throw new Error('Failed to fetch subscription')
    }

    return data
  }

  /**
   * Check if user has active Pro subscription
   */
  async hasActiveProSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId)
      
      if (!subscription) {
        return false
      }

      // Check if subscription is active
      if (subscription.status !== 'active') {
        return false
      }

      // If it's a trial, check if trial has expired
      if (subscription.trial && subscription.trial_ends_at) {
        const trialEndsAt = new Date(subscription.trial_ends_at)
        const now = new Date()
        
        if (now > trialEndsAt) {
          return false // Trial expired
        }
      }

      return subscription.plan === 'pro'
    } catch (error) {
      console.error('Error checking subscription:', error)
      return false
    }
  }

  /**
   * Get subscription status for display
   */
  async getSubscriptionStatus(userId: string): Promise<{
    hasActiveSubscription: boolean
    plan: string | null
    isTrial: boolean
    trialEndsAt: string | null
  }> {
    try {
      const subscription = await this.getUserSubscription(userId)
      
      if (!subscription) {
        return {
          hasActiveSubscription: false,
          plan: null,
          isTrial: false,
          trialEndsAt: null
        }
      }

      return {
        hasActiveSubscription: subscription.status === 'active',
        plan: subscription.plan,
        isTrial: subscription.trial,
        trialEndsAt: subscription.trial_ends_at || null
      }
    } catch (error) {
      console.error('Error getting subscription status:', error)
      
      // For new users or database issues, return default free plan status
      return {
        hasActiveSubscription: false,
        plan: 'free',
        isTrial: false,
        trialEndsAt: null
      }
    }
  }
}

export const paymentService = new PaymentService()
