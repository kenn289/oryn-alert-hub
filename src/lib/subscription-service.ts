import { paymentService } from './payment-service'
import { UserPlan, PLANS } from './watchlist'
import { supabase } from './supabase'
import { ManualProService } from './manual-pro-service'

export interface SubscriptionStatus {
  hasActiveSubscription: boolean
  plan: string | null
  isTrial: boolean
  trialEndsAt: string | null
  isExpired: boolean
  daysRemaining: number | null
  isMasterAccount: boolean
}

export class SubscriptionService {
  /**
   * Get user plan from users table
   */
  async getUserPlanFromDatabase(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('plan')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user plan from database:', error)
        return 'free' // Default to free if error
      }

      return data?.plan || 'free'
    } catch (error) {
      console.error('Error fetching user plan:', error)
      return 'free' // Default to free if error
    }
  }

  /**
   * Force refresh user plan from database
   */
  async refreshUserPlan(userId: string): Promise<string> {
    console.log('🔄 Refreshing user plan from database...')
    return await this.getUserPlanFromDatabase(userId)
  }

  /**
   * Get comprehensive subscription status
   */
  async getSubscriptionStatus(userId: string, userEmail?: string): Promise<SubscriptionStatus> {
    try {
      // Check if this is the master account
      const isMasterAccount = userEmail === 'kennethoswin289@gmail.com'
      
      if (isMasterAccount) {
        return {
          hasActiveSubscription: true,
          plan: 'master',
          isTrial: false,
          trialEndsAt: null,
          isExpired: false,
          daysRemaining: null,
          isMasterAccount: true
        }
      }

      // Check for manual Pro override first
      const hasManualProOverride = await ManualProService.hasValidManualProAccess(userId)
      if (hasManualProOverride) {
        console.log(`🔓 Manual Pro override active for user ${userId}`)
        return {
          hasActiveSubscription: true,
          plan: 'pro',
          isTrial: false,
          trialEndsAt: null,
          isExpired: false,
          daysRemaining: null,
          isMasterAccount: false
        }
      }

      // Get plan directly from users table
      const userPlan = await this.getUserPlanFromDatabase(userId)
      
      // Determine if user has active subscription based on plan
      const hasActiveSubscription = userPlan !== 'free'
      
      return {
        hasActiveSubscription,
        plan: userPlan,
        isTrial: false, // No trial system for now
        trialEndsAt: null,
        isExpired: false,
        daysRemaining: null,
        isMasterAccount: false
      }
    } catch (error) {
      console.error('Error getting subscription status:', error)
      
      // Return default free plan status for new users or database issues
      return {
        hasActiveSubscription: false,
        plan: 'free',
        isTrial: false,
        trialEndsAt: null,
        isExpired: false,
        daysRemaining: null,
        isMasterAccount: false
      }
    }
  }

  /**
   * Check if user has access to Pro features
   */
  async hasProAccess(userId: string, userEmail?: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(userId, userEmail)
    return status.hasActiveSubscription && (status.plan === 'pro' || status.plan === 'master')
  }

  /**
   * Get user plan with fallback to localStorage
   */
  async getUserPlan(userId: string, userEmail?: string): Promise<UserPlan> {
    try {
      const status = await this.getSubscriptionStatus(userId, userEmail)
      
      if (status.isMasterAccount) {
        // Master account gets unlimited access
        return {
          name: 'master',
          maxWatchlistItems: -1,
          maxAlerts: -1,
          maxOptionsFlow: -1,
          maxPortfolioAnalytics: -1,
          maxCustomWebhooks: -1,
          maxTeamMembers: -1,
          features: {
            watchlist: { enabled: true, unlimited: true },
            priceAlerts: { enabled: true, unlimited: true },
            emailNotifications: { enabled: true, unlimited: true },
            basicOptionsFlow: { enabled: true, unlimited: true },
            earningsSummaries: { enabled: true, unlimited: true },
            communitySupport: { enabled: true, unlimited: true },
            advancedOptionsFlow: { enabled: true, unlimited: true },
            aiInsights: { enabled: true, unlimited: true },
            insiderTrading: { enabled: true, unlimited: true },
            portfolioAnalytics: { enabled: true, unlimited: true },
            customWebhooks: { enabled: true, unlimited: true },
            teamCollaboration: { enabled: true, unlimited: true },
            advancedAnalytics: { enabled: true, unlimited: true },
            whiteLabel: { enabled: true, unlimited: true },
            prioritySupport: { enabled: true, unlimited: true }
          }
        }
      }
      
      if (status.hasActiveSubscription && status.plan === 'pro') {
        return PLANS.pro
      }

      // Default free plan
      return PLANS.free
    } catch (error) {
      console.error('Error getting user plan:', error)
      return PLANS.free
    }
  }

  /**
   * Validate subscription before allowing Pro features
   */
  async validateProAccess(userId: string, feature: string, userEmail?: string): Promise<{
    allowed: boolean
    reason?: string
  }> {
    try {
      const status = await this.getSubscriptionStatus(userId, userEmail)
      
      // Master account always has access
      if (status.isMasterAccount) {
        return { allowed: true }
      }
      
      if (!status.hasActiveSubscription) {
        return {
          allowed: false,
          reason: 'No active subscription. Please upgrade to Pro to access this feature.'
        }
      }

      if (status.plan !== 'pro') {
        return {
          allowed: false,
          reason: 'Pro subscription required for this feature.'
        }
      }

      if (status.isExpired) {
        return {
          allowed: false,
          reason: 'Your trial has expired. Please upgrade to continue using Pro features.'
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error validating Pro access:', error)
      return {
        allowed: false,
        reason: 'Unable to verify subscription. Please try again.'
      }
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelSubscription(userId: string): Promise<{
    success: boolean
    message: string
    cancelledAt?: string
  }> {
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel subscription')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      return {
        success: false,
        message: (error as Error).message || 'Failed to cancel subscription'
      }
    }
  }

  /**
   * Get subscription cancellation status
   */
  async getCancellationStatus(userId: string): Promise<{
    canCancel: boolean
    isTrial: boolean
    daysRemaining: number | null
    cancellationReason?: string
  }> {
    try {
      const status = await this.getSubscriptionStatus(userId)
      
      if (!status.hasActiveSubscription) {
        return {
          canCancel: false,
          isTrial: false,
          daysRemaining: null,
          cancellationReason: 'No active subscription to cancel'
        }
      }

      if (status.plan !== 'pro') {
        return {
          canCancel: false,
          isTrial: false,
          daysRemaining: null,
          cancellationReason: 'Only Pro subscriptions can be cancelled'
        }
      }

      return {
        canCancel: true,
        isTrial: status.isTrial,
        daysRemaining: status.daysRemaining
      }
    } catch (error) {
      console.error('Error getting cancellation status:', error)
      return {
        canCancel: false,
        isTrial: false,
        daysRemaining: null,
        cancellationReason: 'Unable to check subscription status'
      }
    }
  }
}

export const subscriptionService = new SubscriptionService()
