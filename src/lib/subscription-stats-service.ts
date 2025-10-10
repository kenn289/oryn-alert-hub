import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export interface SubscriptionStats {
  totalUsers: number
  proUsers: number
  masterUsers: number
  freeUsers: number
  activeSubscriptions: number
  cancelledSubscriptions: number
  expiredSubscriptions: number
  pendingSubscriptions: number
  totalRevenue: number
  monthlyRevenue: number
  revenueGrowth: number
  newSubscriptionsThisMonth: number
  cancelledThisMonth: number
  renewalRate: number
  averageLifetime: number
}

export interface UserStats {
  totalUsers: number
  proUsers: number
  masterUsers: number
  freeUsers: number
  activeUsers: number
  inactiveUsers: number
  newUsersThisMonth: number
  newUsersThisWeek: number
}

export class SubscriptionStatsService {
  /**
   * Get comprehensive subscription statistics
   */
  async getSubscriptionStats(): Promise<SubscriptionStats> {
    try {
      console.log('📊 Fetching subscription statistics...')

      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')

      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw usersError
      }

      // Get all subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select('*')

      if (subscriptionsError) {
        console.error('Error fetching subscriptions:', subscriptionsError)
        throw subscriptionsError
      }

      // Get all payment orders for revenue calculation
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('status', 'paid')

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError)
        throw paymentsError
      }

      // Calculate user statistics
      const totalUsers = users?.length || 0
      const proUsers = users?.filter(u => u.plan === 'pro').length || 0
      const masterUsers = users?.filter(u => u.plan === 'master').length || 0
      const freeUsers = users?.filter(u => u.plan === 'free').length || 0
      const activeUsers = users?.filter(u => u.is_active).length || 0
      const inactiveUsers = totalUsers - activeUsers

      // Calculate subscription statistics
      const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0
      const cancelledSubscriptions = subscriptions?.filter(s => s.status === 'cancelled').length || 0
      const expiredSubscriptions = subscriptions?.filter(s => s.status === 'expired').length || 0
      const pendingSubscriptions = subscriptions?.filter(s => s.status === 'pending').length || 0

      // Calculate revenue
      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      
      // Calculate monthly revenue
      const currentMonth = new Date()
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const monthlyRevenue = payments?.filter(p => 
        new Date(p.paid_at || p.created_at) >= startOfMonth
      ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      // Calculate revenue growth
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      const endOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0)
      const lastMonthRevenue = payments?.filter(p => {
        const paymentDate = new Date(p.paid_at || p.created_at)
        return paymentDate >= lastMonth && paymentDate <= endOfLastMonth
      }).reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      const revenueGrowth = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0

      // Calculate monthly subscription changes
      const newSubscriptionsThisMonth = subscriptions?.filter(s => {
        const createdDate = new Date(s.created_at)
        return createdDate >= startOfMonth
      }).length || 0

      const cancelledThisMonth = subscriptions?.filter(s => {
        const cancelledDate = new Date(s.cancellation_date || s.updated_at)
        return s.status === 'cancelled' && cancelledDate >= startOfMonth
      }).length || 0

      // Calculate renewal rate
      const renewalRate = activeSubscriptions > 0 
        ? ((activeSubscriptions - cancelledThisMonth) / activeSubscriptions) * 100 
        : 0

      // Calculate average lifetime (simplified)
      const averageLifetime = this.calculateAverageLifetime(subscriptions || [])

      const stats: SubscriptionStats = {
        totalUsers,
        proUsers,
        masterUsers,
        freeUsers,
        activeSubscriptions,
        cancelledSubscriptions,
        expiredSubscriptions,
        pendingSubscriptions,
        totalRevenue,
        monthlyRevenue,
        revenueGrowth,
        newSubscriptionsThisMonth,
        cancelledThisMonth,
        renewalRate,
        averageLifetime
      }

      console.log('✅ Subscription statistics calculated:', {
        totalUsers,
        proUsers,
        activeSubscriptions,
        totalRevenue
      })

      return stats

    } catch (error) {
      console.error('Error calculating subscription stats:', error)
      throw error
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')

      if (error) throw error

      const totalUsers = users?.length || 0
      const proUsers = users?.filter(u => u.plan === 'pro').length || 0
      const masterUsers = users?.filter(u => u.plan === 'master').length || 0
      const freeUsers = users?.filter(u => u.plan === 'free').length || 0
      const activeUsers = users?.filter(u => u.is_active).length || 0
      const inactiveUsers = totalUsers - activeUsers

      // Calculate new users this month
      const currentMonth = new Date()
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const newUsersThisMonth = users?.filter(u => 
        new Date(u.created_at) >= startOfMonth
      ).length || 0

      // Calculate new users this week
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      const newUsersThisWeek = users?.filter(u => 
        new Date(u.created_at) >= startOfWeek
      ).length || 0

      return {
        totalUsers,
        proUsers,
        masterUsers,
        freeUsers,
        activeUsers,
        inactiveUsers,
        newUsersThisMonth,
        newUsersThisWeek
      }

    } catch (error) {
      console.error('Error calculating user stats:', error)
      throw error
    }
  }

  /**
   * Sync subscription data with Razorpay
   */
  async syncWithRazorpay(): Promise<{ synced: number; errors: number }> {
    try {
      console.log('🔄 Syncing subscription data with Razorpay...')

      // Get all active subscriptions
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('status', 'active')

      if (error) throw error

      let synced = 0
      let errors = 0

      for (const subscription of subscriptions || []) {
        try {
          // Check if subscription is still valid
          const endDate = new Date(subscription.end_date)
          const now = new Date()

          if (endDate < now) {
            // Subscription has expired
            await supabase
              .from('user_subscriptions')
              .update({ 
                status: 'expired',
                updated_at: new Date().toISOString()
              })
              .eq('id', subscription.id)

            // Update user plan to free
            await supabase
              .from('users')
              .update({ 
                plan: 'free',
                updated_at: new Date().toISOString()
              })
              .eq('id', subscription.user_id)

            synced++
            console.log(`✅ Expired subscription for user ${subscription.user_id}`)
          } else {
            // Subscription is still active, ensure user plan is correct
            await supabase
              .from('users')
              .update({ 
                plan: subscription.plan,
                updated_at: new Date().toISOString()
              })
              .eq('id', subscription.user_id)

            synced++
          }
        } catch (error) {
          console.error(`Error syncing subscription ${subscription.id}:`, error)
          errors++
        }
      }

      console.log(`✅ Razorpay sync completed: ${synced} synced, ${errors} errors`)
      return { synced, errors }

    } catch (error) {
      console.error('Error syncing with Razorpay:', error)
      throw error
    }
  }

  /**
   * Recalculate all subscription statistics
   */
  async recalculateStats(): Promise<SubscriptionStats> {
    try {
      console.log('🔄 Recalculating all subscription statistics...')

      // First sync with Razorpay
      await this.syncWithRazorpay()

      // Then get fresh stats
      const stats = await this.getSubscriptionStats()

      // Log the recalculation
      console.log('📊 Statistics recalculated:', {
        totalUsers: stats.totalUsers,
        proUsers: stats.proUsers,
        activeSubscriptions: stats.activeSubscriptions,
        totalRevenue: stats.totalRevenue
      })

      return stats

    } catch (error) {
      console.error('Error recalculating stats:', error)
      throw error
    }
  }

  /**
   * Calculate average subscription lifetime
   */
  private calculateAverageLifetime(subscriptions: any[]): number {
    if (subscriptions.length === 0) return 0

    const lifetimes = subscriptions
      .filter(s => s.status === 'cancelled' || s.status === 'expired')
      .map(s => {
        const startDate = new Date(s.start_date)
        const endDate = new Date(s.cancellation_date || s.end_date)
        return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) // days
      })
      .filter(days => days > 0)

    if (lifetimes.length === 0) return 0

    return lifetimes.reduce((sum, days) => sum + days, 0) / lifetimes.length
  }

  /**
   * Get subscription statistics for a specific date range
   */
  async getStatsForDateRange(startDate: string, endDate: string): Promise<Partial<SubscriptionStats>> {
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)

      // Get subscriptions created in date range
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

      // Get payments in date range
      const { data: payments } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('status', 'paid')
        .gte('paid_at', start.toISOString())
        .lte('paid_at', end.toISOString())

      const newSubscriptions = subscriptions?.length || 0
      const revenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      return {
        newSubscriptionsThisMonth: newSubscriptions,
        monthlyRevenue: revenue
      }

    } catch (error) {
      console.error('Error getting stats for date range:', error)
      throw error
    }
  }
}

export const subscriptionStatsService = new SubscriptionStatsService()
