import { createClient } from '@supabase/supabase-js'
import { emailService } from './email-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export interface SubscriptionStatus {
  id: string
  userId: string
  plan: string
  status: 'active' | 'cancelled' | 'expired' | 'suspended' | 'pending'
  startDate: string
  endDate: string
  autoRenew: boolean
  daysRemaining: number
  isTrial: boolean
  trialEndsAt?: string
  nextBillingDate?: string
  cancellationDate?: string
  cancellationReason?: string
  paymentMethod: string
  lastPaymentDate?: string
  nextPaymentAmount?: number
  currency: string
}

export interface SubscriptionMetrics {
  totalRevenue: number
  activeSubscriptions: number
  cancelledThisMonth: number
  renewalRate: number
  averageLifetime: number
}

export class SubscriptionLifecycleService {
  /**
   * Activate subscription after successful payment
   */
  async activateSubscription(
    userId: string,
    plan: string,
    paymentAmount: number,
    currency: string = 'INR',
    isTrial: boolean = false,
    trialDays: number = 7
  ): Promise<SubscriptionStatus> {
    try {
      console.log('🎬 Activating subscription for user:', userId)
      
      // Calculate subscription dates
      const startDate = new Date()
      const endDate = new Date()
      
      if (isTrial) {
        endDate.setDate(endDate.getDate() + trialDays)
      } else {
        endDate.setMonth(endDate.getMonth() + 1) // Monthly subscription
      }
      
      const nextBillingDate = isTrial ? endDate : new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      // Create or update subscription
      const subscriptionData = {
        user_id: userId,
        plan,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        auto_renew: true,
        is_trial: isTrial,
        trial_ends_at: isTrial ? endDate.toISOString() : null,
        next_billing_date: nextBillingDate.toISOString(),
        payment_method: 'Razorpay',
        last_payment_date: startDate.toISOString(),
        next_payment_amount: paymentAmount,
        currency,
        created_at: startDate.toISOString(),
        updated_at: startDate.toISOString()
      }
      
      // Check if user already has a subscription
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
      
      let subscription
      if (existingSubscription) {
        // Update existing subscription
        const { data, error } = await supabase
          .from('user_subscriptions')
          .update(subscriptionData)
          .eq('id', existingSubscription.id)
          .select()
          .single()
        
        if (error) throw error
        subscription = data
      } else {
        // Create new subscription
        const { data, error } = await supabase
          .from('user_subscriptions')
          .insert(subscriptionData)
          .select()
          .single()
        
        if (error) throw error
        subscription = data
      }
      
      // Update user plan in users table
      await supabase
        .from('users')
        .update({
          plan,
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
      
      // Send activation email
      await this.sendActivationEmail(userId, subscription)
      
      // Log subscription event
      await this.logSubscriptionEvent(userId, 'activated', {
        plan,
        isTrial,
        trialDays,
        amount: paymentAmount,
        currency
      })
      
      return this.mapToSubscriptionStatus(subscription)
      
    } catch (error) {
      console.error('Error activating subscription:', error)
      throw new Error('Failed to activate subscription')
    }
  }
  
  /**
   * Get user's subscription status with days remaining
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error || !subscription) {
        return null
      }
      
      return this.mapToSubscriptionStatus(subscription)
      
    } catch (error) {
      console.error('Error fetching subscription status:', error)
      return null
    }
  }
  
  /**
   * Cancel subscription (effective at end of period)
   */
  async cancelSubscription(
    userId: string,
    reason?: string,
    immediate: boolean = false
  ): Promise<{ success: boolean; message: string; effectiveDate?: string }> {
    try {
      console.log('🚫 Cancelling subscription for user:', userId)
      
      const subscription = await this.getSubscriptionStatus(userId)
      if (!subscription) {
        return { success: false, message: 'No active subscription found' }
      }
      
      if (subscription.status === 'cancelled') {
        return { success: false, message: 'Subscription is already cancelled' }
      }
      
      const cancellationDate = new Date()
      const effectiveDate = immediate ? cancellationDate : new Date(subscription.endDate)
      
      // Update subscription
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: immediate ? 'cancelled' : 'cancelled',
          auto_renew: false,
          cancellation_date: cancellationDate.toISOString(),
          cancellation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
      
      if (error) throw error
      
      // Send cancellation email
      await this.sendCancellationEmail(userId, subscription, effectiveDate, reason)
      
      // Log cancellation event
      await this.logSubscriptionEvent(userId, 'cancelled', {
        reason,
        immediate,
        effectiveDate: effectiveDate.toISOString()
      })
      
      const message = immediate 
        ? 'Your subscription has been cancelled immediately.'
        : `Your subscription will be cancelled on ${effectiveDate.toLocaleDateString()}. You'll retain access until then.`
      
      return {
        success: true,
        message,
        effectiveDate: effectiveDate.toISOString()
      }
      
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      return { success: false, message: 'Failed to cancel subscription' }
    }
  }
  
  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Reactivating subscription for user:', userId)
      
      const subscription = await this.getSubscriptionStatus(userId)
      if (!subscription) {
        return { success: false, message: 'No subscription found' }
      }
      
      if (subscription.status !== 'cancelled') {
        return { success: false, message: 'Subscription is not cancelled' }
      }
      
      // Calculate new end date
      const newEndDate = new Date()
      newEndDate.setMonth(newEndDate.getMonth() + 1)
      
      // Update subscription
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          auto_renew: true,
          end_date: newEndDate.toISOString(),
          cancellation_date: null,
          cancellation_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
      
      if (error) throw error
      
      // Send reactivation email
      await this.sendReactivationEmail(userId, subscription)
      
      // Log reactivation event
      await this.logSubscriptionEvent(userId, 'reactivated', {
        newEndDate: newEndDate.toISOString()
      })
      
      return {
        success: true,
        message: 'Your subscription has been reactivated successfully!'
      }
      
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      return { success: false, message: 'Failed to reactivate subscription' }
    }
  }
  
  /**
   * Setup auto-renewal
   */
  async setupAutoRenewal(userId: string, enabled: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          auto_renew: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
      
      if (error) throw error
      
      const message = enabled 
        ? 'Auto-renewal has been enabled. Your subscription will automatically renew.'
        : 'Auto-renewal has been disabled. You will need to manually renew your subscription.'
      
      return { success: true, message }
      
    } catch (error) {
      console.error('Error setting up auto-renewal:', error)
      return { success: false, message: 'Failed to update auto-renewal settings' }
    }
  }
  
  /**
   * Process subscription renewals (cron job)
   */
  async processRenewals(): Promise<{ processed: number; errors: number }> {
    try {
      console.log('🔄 Processing subscription renewals...')
      
      // Find subscriptions that need renewal
      const { data: expiringSubscriptions, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('status', 'active')
        .eq('auto_renew', true)
        .lte('end_date', new Date().toISOString())
      
      if (error) throw error
      
      let processed = 0
      let errors = 0
      
      for (const subscription of expiringSubscriptions || []) {
        try {
          // Attempt to charge the user
          const renewalResult = await this.processRenewalPayment(subscription)
          
          if (renewalResult.success) {
            // Extend subscription
            const newEndDate = new Date()
            newEndDate.setMonth(newEndDate.getMonth() + 1)
            
            await supabase
              .from('user_subscriptions')
              .update({
                end_date: newEndDate.toISOString(),
                last_payment_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', subscription.id)
            
            // Send renewal confirmation
            await this.sendRenewalConfirmationEmail(subscription.user_id, subscription)
            
            processed++
          } else {
            // Mark as failed and send notification
            await supabase
              .from('user_subscriptions')
              .update({
                status: 'suspended',
                updated_at: new Date().toISOString()
              })
              .eq('id', subscription.id)
            
            await this.sendPaymentFailureEmail(subscription.user_id, subscription, renewalResult.error)
            errors++
          }
        } catch (error) {
          console.error('Error processing renewal for subscription:', subscription.id, error)
          errors++
        }
      }
      
      console.log(`✅ Processed ${processed} renewals, ${errors} errors`)
      return { processed, errors }
      
    } catch (error) {
      console.error('Error processing renewals:', error)
      return { processed: 0, errors: 1 }
    }
  }
  
  /**
   * Get subscription metrics
   */
  async getSubscriptionMetrics(): Promise<SubscriptionMetrics> {
    try {
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('*')
      
      if (!subscriptions) {
        return {
          totalRevenue: 0,
          activeSubscriptions: 0,
          cancelledThisMonth: 0,
          renewalRate: 0,
          averageLifetime: 0
        }
      }
      
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length
      const cancelledThisMonth = subscriptions.filter(s => 
        s.status === 'cancelled' && 
        new Date(s.cancellation_date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      ).length
      
      const totalRevenue = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.next_payment_amount || 0), 0)
      
      const renewalRate = subscriptions.length > 0 
        ? (activeSubscriptions / subscriptions.length) * 100 
        : 0
      
      return {
        totalRevenue,
        activeSubscriptions,
        cancelledThisMonth,
        renewalRate,
        averageLifetime: 0 // Calculate based on your business logic
      }
      
    } catch (error) {
      console.error('Error fetching subscription metrics:', error)
      return {
        totalRevenue: 0,
        activeSubscriptions: 0,
        cancelledThisMonth: 0,
        renewalRate: 0,
        averageLifetime: 0
      }
    }
  }
  
  /**
   * Map database subscription to SubscriptionStatus
   */
  private mapToSubscriptionStatus(subscription: any): SubscriptionStatus {
    const now = new Date()
    const endDate = new Date(subscription.end_date)
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    
    return {
      id: subscription.id,
      userId: subscription.user_id,
      plan: subscription.plan,
      status: subscription.status,
      startDate: subscription.start_date,
      endDate: subscription.end_date,
      autoRenew: subscription.auto_renew,
      daysRemaining,
      isTrial: subscription.is_trial,
      trialEndsAt: subscription.trial_ends_at,
      nextBillingDate: subscription.next_billing_date,
      cancellationDate: subscription.cancellation_date,
      cancellationReason: subscription.cancellation_reason,
      paymentMethod: subscription.payment_method,
      lastPaymentDate: subscription.last_payment_date,
      nextPaymentAmount: subscription.next_payment_amount,
      currency: subscription.currency
    }
  }
  
  /**
   * Process renewal payment
   */
  private async processRenewalPayment(subscription: any): Promise<{ success: boolean; error?: string }> {
    // This would integrate with Razorpay to charge the user
    console.log('💳 Processing renewal payment for subscription:', subscription.id)
    
    // Mock payment processing
    return { success: true }
  }
  
  /**
   * Send activation email
   */
  private async sendActivationEmail(userId: string, subscription: any) {
    console.log('📧 Sending activation email to user:', userId)
    // Implementation would send activation email
  }
  
  /**
   * Send cancellation email
   */
  private async sendCancellationEmail(userId: string, subscription: SubscriptionStatus, effectiveDate: Date, reason?: string) {
    console.log('📧 Sending cancellation email to user:', userId)
    // Implementation would send cancellation email
  }
  
  /**
   * Send reactivation email
   */
  private async sendReactivationEmail(userId: string, subscription: SubscriptionStatus) {
    console.log('📧 Sending reactivation email to user:', userId)
    // Implementation would send reactivation email
  }
  
  /**
   * Send renewal confirmation email
   */
  private async sendRenewalConfirmationEmail(userId: string, subscription: any) {
    console.log('📧 Sending renewal confirmation email to user:', userId)
    // Implementation would send renewal confirmation email
  }
  
  /**
   * Send payment failure email
   */
  private async sendPaymentFailureEmail(userId: string, subscription: any, error: string) {
    console.log('📧 Sending payment failure email to user:', userId)
    // Implementation would send payment failure email
  }
  
  /**
   * Log subscription event
   */
  private async logSubscriptionEvent(userId: string, event: string, data: any) {
    const { error } = await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: event,
        event_data: JSON.stringify(data),
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error logging subscription event:', error)
    }
  }
}

export const subscriptionLifecycleService = new SubscriptionLifecycleService()
