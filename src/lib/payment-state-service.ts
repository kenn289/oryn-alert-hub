import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export interface PaymentState {
  id: string
  userId: string
  orderId: string
  status: 'pending' | 'success' | 'failed' | 'cancelled' | 'expired'
  plan: string
  amount: number
  currency: string
  paymentId?: string
  createdAt: string
  expiresAt: string
  errorMessage?: string
}

export class PaymentStateService {
  /**
   * Create a new payment state
   */
  async createPaymentState(
    userId: string,
    orderId: string,
    plan: string,
    amount: number,
    currency: string = 'INR'
  ): Promise<PaymentState> {
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      
      const { data, error } = await supabase
        .from('payment_states')
        .insert({
          user_id: userId,
          order_id: orderId,
          status: 'pending',
          plan,
          amount,
          currency,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        userId: data.user_id,
        orderId: data.order_id,
        status: data.status,
        plan: data.plan,
        amount: data.amount,
        currency: data.currency,
        createdAt: data.created_at,
        expiresAt: data.expires_at
      }
    } catch (error) {
      console.error('Error creating payment state:', error)
      throw error
    }
  }

  /**
   * Get payment state by order ID
   */
  async getPaymentState(orderId: string): Promise<PaymentState | null> {
    try {
      const { data, error } = await supabase
        .from('payment_states')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (error || !data) return null

      return {
        id: data.id,
        userId: data.user_id,
        orderId: data.order_id,
        status: data.status,
        plan: data.plan,
        amount: data.amount,
        currency: data.currency,
        paymentId: data.payment_id,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        errorMessage: data.error_message
      }
    } catch (error) {
      console.error('Error getting payment state:', error)
      return null
    }
  }

  /**
   * Update payment state
   */
  async updatePaymentState(
    orderId: string,
    status: PaymentState['status'],
    paymentId?: string,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (paymentId) {
        updateData.payment_id = paymentId
      }

      if (errorMessage) {
        updateData.error_message = errorMessage
      }

      const { error } = await supabase
        .from('payment_states')
        .update(updateData)
        .eq('order_id', orderId)

      return !error
    } catch (error) {
      console.error('Error updating payment state:', error)
      return false
    }
  }

  /**
   * Handle payment success
   */
  async handlePaymentSuccess(orderId: string, paymentId: string): Promise<boolean> {
    try {
      // Update payment state
      const success = await this.updatePaymentState(orderId, 'success', paymentId)
      
      if (!success) return false

      // Get payment details
      const paymentState = await this.getPaymentState(orderId)
      if (!paymentState) return false

      // Activate subscription
      const { subscriptionLifecycleService } = await import('./subscription-lifecycle-service')
      
      await subscriptionLifecycleService.activateSubscription(
        paymentState.userId,
        paymentState.plan,
        paymentState.amount,
        paymentState.currency,
        false // Not a trial
      )

      return true
    } catch (error) {
      console.error('Error handling payment success:', error)
      return false
    }
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(orderId: string, errorMessage: string): Promise<boolean> {
    try {
      return await this.updatePaymentState(orderId, 'failed', undefined, errorMessage)
    } catch (error) {
      console.error('Error handling payment failure:', error)
      return false
    }
  }

  /**
   * Handle payment cancellation
   */
  async handlePaymentCancellation(orderId: string): Promise<boolean> {
    try {
      return await this.updatePaymentState(orderId, 'cancelled')
    } catch (error) {
      console.error('Error handling payment cancellation:', error)
      return false
    }
  }

  /**
   * Clean up expired payment states
   */
  async cleanupExpiredPayments(): Promise<void> {
    try {
      await supabase
        .from('payment_states')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .eq('status', 'pending')
    } catch (error) {
      console.error('Error cleaning up expired payments:', error)
    }
  }

  /**
   * Get user's payment history
   */
  async getUserPaymentHistory(userId: string, limit: number = 10): Promise<PaymentState[]> {
    try {
      const { data, error } = await supabase
        .from('payment_states')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data.map(payment => ({
        id: payment.id,
        userId: payment.user_id,
        orderId: payment.order_id,
        status: payment.status,
        plan: payment.plan,
        amount: payment.amount,
        currency: payment.currency,
        paymentId: payment.payment_id,
        createdAt: payment.created_at,
        expiresAt: payment.expires_at,
        errorMessage: payment.error_message
      }))
    } catch (error) {
      console.error('Error getting user payment history:', error)
      return []
    }
  }

  /**
   * Check if user has pending payment
   */
  async hasPendingPayment(userId: string): Promise<PaymentState | null> {
    try {
      const { data, error } = await supabase
        .from('payment_states')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) return null

      return {
        id: data.id,
        userId: data.user_id,
        orderId: data.order_id,
        status: data.status,
        plan: data.plan,
        amount: data.amount,
        currency: data.currency,
        paymentId: data.payment_id,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        errorMessage: data.error_message
      }
    } catch (error) {
      console.error('Error checking pending payment:', error)
      return null
    }
  }
}

export const paymentStateService = new PaymentStateService()
