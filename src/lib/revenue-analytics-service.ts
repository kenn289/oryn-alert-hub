import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export interface RevenueAnalytics {
  totalRevenue: number
  totalUsers: number
  activeSubscriptions: number
  monthlyRevenue: number
  revenueByPlan: { [plan: string]: number }
  recentPayments: Array<{
    id: string
    user_id: string
    plan: string
    amount: number
    currency: string
    paid_at: string
    user_name?: string
    user_email?: string
  }>
  revenueGrowth: {
    thisMonth: number
    lastMonth: number
    growthPercentage: number
  }
  subscriptionStats: {
    newThisMonth: number
    cancelledThisMonth: number
    renewalRate: number
  }
}

export class RevenueAnalyticsService {
  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    try {
      // Get confirmed revenue logs (more accurate than payment_orders)
      const { data: revenueLogs, error: revenueError } = await supabase
        .from('revenue_logs')
        .select('*')
        .eq('status', 'confirmed')
        .order('confirmed_at', { ascending: false })

      if (revenueError) {
        console.error('Error fetching revenue logs:', revenueError)
        // Fallback to payment_orders if revenue_logs table doesn't exist
        console.log('Falling back to payment_orders table...')
        return await this.getRevenueAnalyticsFromPaymentOrders()
      }

      // Get all paid orders as fallback
      const { data: paidOrders, error: ordersError } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })

      if (ordersError) {
        console.error('Error fetching paid orders:', ordersError)
        throw new Error('Failed to fetch revenue data')
      }

      // Get all users
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, created_at')

      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw new Error('Failed to fetch user data')
      }

      // Get active subscriptions
      const { data: activeSubscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('status', 'active')

      if (subsError) {
        console.error('Error fetching subscriptions:', subsError)
        throw new Error('Failed to fetch subscription data')
      }

      // Use revenue logs if available, otherwise fallback to payment orders
      const revenueData = revenueLogs && revenueLogs.length > 0 ? revenueLogs : paidOrders
      const isRevenueLogs = revenueLogs && revenueLogs.length > 0

      // Calculate total revenue
      const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0

      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = revenueData?.filter(item => {
        const itemDate = new Date(isRevenueLogs ? item.confirmed_at : item.paid_at)
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
      }).reduce((sum, item) => sum + (item.amount || 0), 0) || 0

      // Calculate revenue by plan
      const revenueByPlan: { [plan: string]: number } = {}
      revenueData?.forEach(item => {
        const plan = item.plan || 'unknown'
        revenueByPlan[plan] = (revenueByPlan[plan] || 0) + (item.amount || 0)
      })

      // Get recent payments with user details
      const recentPayments = await Promise.all(
        (paidOrders?.slice(0, 10) || []).map(async (order) => {
          const { data: userData } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', order.user_id)
            .single()

          return {
            id: order.order_id,
            user_id: order.user_id,
            plan: order.plan,
            amount: order.amount,
            currency: order.currency,
            paid_at: order.paid_at,
            user_name: userData?.name,
            user_email: userData?.email
          }
        })
      )

      // Calculate revenue growth
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
      
      const lastMonthRevenue = paidOrders?.filter(order => {
        const orderDate = new Date(order.paid_at)
        return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear
      }).reduce((sum, order) => sum + (order.amount || 0), 0) || 0

      const growthPercentage = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0

      // Calculate subscription stats
      const newThisMonth = activeSubscriptions?.filter(sub => {
        const subDate = new Date(sub.created_at)
        return subDate.getMonth() === currentMonth && subDate.getFullYear() === currentYear
      }).length || 0

      const cancelledThisMonth = activeSubscriptions?.filter(sub => {
        const cancelledDate = new Date(sub.updated_at)
        return sub.status === 'cancelled' && 
               cancelledDate.getMonth() === currentMonth && 
               cancelledDate.getFullYear() === currentYear
      }).length || 0

      const renewalRate = activeSubscriptions?.length > 0 
        ? ((activeSubscriptions.length - cancelledThisMonth) / activeSubscriptions.length) * 100 
        : 0

      return {
        totalRevenue,
        totalUsers: allUsers?.length || 0,
        activeSubscriptions: activeSubscriptions?.length || 0,
        monthlyRevenue,
        revenueByPlan,
        recentPayments,
        revenueGrowth: {
          thisMonth: monthlyRevenue,
          lastMonth: lastMonthRevenue,
          growthPercentage
        },
        subscriptionStats: {
          newThisMonth,
          cancelledThisMonth,
          renewalRate
        }
      }

    } catch (error) {
      console.error('Revenue analytics error:', error)
      throw new Error('Failed to generate revenue analytics')
    }
  }

  /**
   * Fallback method to get revenue analytics from payment_orders table
   */
  private async getRevenueAnalyticsFromPaymentOrders(): Promise<RevenueAnalytics> {
    try {
      // Get all paid orders
      const { data: paidOrders, error: ordersError } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })

      if (ordersError) {
        console.error('Error fetching paid orders:', ordersError)
        throw new Error('Failed to fetch revenue data')
      }

      // Get all users
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, created_at')

      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw new Error('Failed to fetch user data')
      }

      // Get active subscriptions
      const { data: activeSubscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('status', 'active')

      if (subsError) {
        console.error('Error fetching subscriptions:', subsError)
        throw new Error('Failed to fetch subscription data')
      }

      // Calculate total revenue
      const totalRevenue = paidOrders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0

      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = paidOrders?.filter(order => {
        const orderDate = new Date(order.paid_at)
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
      }).reduce((sum, order) => sum + (order.amount || 0), 0) || 0

      // Calculate revenue by plan
      const revenueByPlan: { [plan: string]: number } = {}
      paidOrders?.forEach(order => {
        const plan = order.plan || 'unknown'
        revenueByPlan[plan] = (revenueByPlan[plan] || 0) + (order.amount || 0)
      })

      // Get recent payments with user details
      const recentPayments = await Promise.all(
        (paidOrders?.slice(0, 10) || []).map(async (order) => {
          const { data: userData } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', order.user_id)
            .single()

          return {
            id: order.order_id,
            user_id: order.user_id,
            plan: order.plan,
            amount: order.amount,
            currency: order.currency,
            paid_at: order.paid_at,
            user_name: userData?.name,
            user_email: userData?.email
          }
        })
      )

      // Calculate revenue growth
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
      
      const lastMonthRevenue = paidOrders?.filter(order => {
        const orderDate = new Date(order.paid_at)
        return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear
      }).reduce((sum, order) => sum + (order.amount || 0), 0) || 0

      const growthPercentage = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0

      // Calculate subscription stats
      const newThisMonth = activeSubscriptions?.filter(sub => {
        const subDate = new Date(sub.created_at)
        return subDate.getMonth() === currentMonth && subDate.getFullYear() === currentYear
      }).length || 0

      const cancelledThisMonth = activeSubscriptions?.filter(sub => {
        const cancelledDate = new Date(sub.updated_at)
        return sub.status === 'cancelled' && 
               cancelledDate.getMonth() === currentMonth && 
               cancelledDate.getFullYear() === currentYear
      }).length || 0

      const renewalRate = activeSubscriptions?.length > 0 
        ? ((activeSubscriptions.length - cancelledThisMonth) / activeSubscriptions.length) * 100 
        : 0

      return {
        totalRevenue,
        totalUsers: allUsers?.length || 0,
        activeSubscriptions: activeSubscriptions?.length || 0,
        monthlyRevenue,
        revenueByPlan,
        recentPayments,
        revenueGrowth: {
          thisMonth: monthlyRevenue,
          lastMonth: lastMonthRevenue,
          growthPercentage
        },
        subscriptionStats: {
          newThisMonth,
          cancelledThisMonth,
          renewalRate
        }
      }

    } catch (error) {
      console.error('Error in fallback revenue analytics:', error)
      throw error
    }
  }

  async getRevenueChartData(days: number = 30): Promise<Array<{ date: string; revenue: number; users: number }>> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: orders, error } = await supabase
        .from('payment_orders')
        .select('amount, paid_at, user_id')
        .eq('status', 'paid')
        .gte('paid_at', startDate.toISOString())
        .lte('paid_at', endDate.toISOString())
        .order('paid_at', { ascending: true })

      if (error) {
        console.error('Error fetching chart data:', error)
        throw new Error('Failed to fetch chart data')
      }

      // Group by date
      const dailyData: { [date: string]: { revenue: number; users: Set<string> } } = {}
      
      orders?.forEach(order => {
        const date = new Date(order.paid_at).toISOString().split('T')[0]
        if (!dailyData[date]) {
          dailyData[date] = { revenue: 0, users: new Set() }
        }
        dailyData[date].revenue += order.amount || 0
        dailyData[date].users.add(order.user_id)
      })

      // Convert to array format
      return Object.entries(dailyData).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        users: data.users.size
      }))

    } catch (error) {
      console.error('Chart data error:', error)
      throw new Error('Failed to generate chart data')
    }
  }
}

export const revenueAnalyticsService = new RevenueAnalyticsService()
