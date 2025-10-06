import { createClient } from '@supabase/supabase-js'
import { multiApiStockService } from './multi-api-stock-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface WatchlistItem {
  id: string
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  market: string
  currency: string
  addedAt: string
}

export interface FeatureAccess {
  enabled: boolean
  unlimited?: boolean
  max?: number
  description?: string
}

export interface UserPlan {
  name: 'free' | 'pro' | 'master'
  maxWatchlistItems: number
  maxAlerts: number
  maxOptionsFlow: number
  maxPortfolioAnalytics: number
  maxCustomWebhooks: number
  maxTeamMembers: number
  features: {
    // Free features
    watchlist: FeatureAccess
    priceAlerts: FeatureAccess
    emailNotifications: FeatureAccess
    basicOptionsFlow: FeatureAccess
    earningsSummaries: FeatureAccess
    communitySupport: FeatureAccess
    
    // Pro features
    advancedOptionsFlow: FeatureAccess
    aiInsights: FeatureAccess
    insiderTrading: FeatureAccess
    portfolioAnalytics: FeatureAccess
    customWebhooks: FeatureAccess
    teamCollaboration: FeatureAccess
    advancedAnalytics: FeatureAccess
    whiteLabel: FeatureAccess
    prioritySupport: FeatureAccess
  }
}

export const PLANS: Record<string, UserPlan> = {
  free: {
    name: 'free',
    maxWatchlistItems: 5,
    maxAlerts: 3,
    maxOptionsFlow: 1,
    maxPortfolioAnalytics: 0,
    maxCustomWebhooks: 0,
    maxTeamMembers: 0,
    features: {
      watchlist: { enabled: true, max: 5, description: 'Track up to 5 stocks' },
      priceAlerts: { enabled: true, max: 3, description: 'Set up to 3 price alerts' },
      emailNotifications: { enabled: true, description: 'Email notifications for alerts' },
      basicOptionsFlow: { enabled: true, max: 1, description: 'Basic options flow analysis' },
      earningsSummaries: { enabled: true, description: 'AI-powered earnings summaries' },
      communitySupport: { enabled: true, description: 'Community support' },
      advancedOptionsFlow: { enabled: false, description: 'Advanced options flow analysis' },
      aiInsights: { enabled: false, description: 'AI-powered market insights' },
      insiderTrading: { enabled: false, description: 'Insider trading data' },
      portfolioAnalytics: { enabled: false, description: 'Portfolio analytics and insights' },
      customWebhooks: { enabled: false, description: 'Custom webhook integrations' },
      teamCollaboration: { enabled: false, description: 'Team collaboration features' },
      advancedAnalytics: { enabled: false, description: 'Advanced analytics dashboard' },
      whiteLabel: { enabled: false, description: 'White-label solutions' },
      prioritySupport: { enabled: false, description: 'Priority customer support' }
    }
  },
  pro: {
    name: 'pro',
    maxWatchlistItems: -1,
    maxAlerts: -1,
    maxOptionsFlow: -1,
    maxPortfolioAnalytics: -1,
    maxCustomWebhooks: 5,
    maxTeamMembers: 0,
    features: {
      watchlist: { enabled: true, unlimited: true, description: 'Unlimited watchlist items' },
      priceAlerts: { enabled: true, unlimited: true, description: 'Unlimited price alerts' },
      emailNotifications: { enabled: true, description: 'Email notifications for alerts' },
      basicOptionsFlow: { enabled: true, unlimited: true, description: 'Unlimited options flow analysis' },
      earningsSummaries: { enabled: true, description: 'AI-powered earnings summaries' },
      communitySupport: { enabled: true, description: 'Community support' },
      advancedOptionsFlow: { enabled: true, unlimited: true, description: 'Advanced options flow analysis' },
      aiInsights: { enabled: true, unlimited: true, description: 'AI-powered market insights' },
      insiderTrading: { enabled: true, unlimited: true, description: 'Insider trading data' },
      portfolioAnalytics: { enabled: true, unlimited: true, description: 'Portfolio analytics and insights' },
      customWebhooks: { enabled: true, max: 5, description: 'Up to 5 custom webhook integrations' },
      teamCollaboration: { enabled: false, description: 'Team collaboration features' },
      advancedAnalytics: { enabled: true, unlimited: true, description: 'Advanced analytics dashboard' },
      whiteLabel: { enabled: false, description: 'White-label solutions' },
      prioritySupport: { enabled: true, description: 'Priority customer support' }
    }
  },
  master: {
    name: 'master',
    maxWatchlistItems: -1,
    maxAlerts: -1,
    maxOptionsFlow: -1,
    maxPortfolioAnalytics: -1,
    maxCustomWebhooks: -1,
    maxTeamMembers: -1,
    features: {
      watchlist: { enabled: true, unlimited: true, description: 'Unlimited watchlist items' },
      priceAlerts: { enabled: true, unlimited: true, description: 'Unlimited price alerts' },
      emailNotifications: { enabled: true, description: 'Email notifications for alerts' },
      basicOptionsFlow: { enabled: true, unlimited: true, description: 'Unlimited options flow analysis' },
      earningsSummaries: { enabled: true, description: 'AI-powered earnings summaries' },
      communitySupport: { enabled: true, description: 'Community support' },
      advancedOptionsFlow: { enabled: true, unlimited: true, description: 'Advanced options flow analysis' },
      aiInsights: { enabled: true, unlimited: true, description: 'AI-powered market insights' },
      insiderTrading: { enabled: true, unlimited: true, description: 'Insider trading data' },
      portfolioAnalytics: { enabled: true, unlimited: true, description: 'Portfolio analytics and insights' },
      customWebhooks: { enabled: true, unlimited: true, description: 'Unlimited custom webhook integrations' },
      teamCollaboration: { enabled: true, unlimited: true, description: 'Unlimited team collaboration' },
      advancedAnalytics: { enabled: true, unlimited: true, description: 'Advanced analytics dashboard' },
      whiteLabel: { enabled: true, unlimited: true, description: 'White-label solutions' },
      prioritySupport: { enabled: true, description: 'Priority customer support' }
    }
  }
}

export class WatchlistService {
  private static STORAGE_KEY = 'oryn_watchlist'

  // Get user's watchlist from database
  static async getWatchlist(userId: string): Promise<WatchlistItem[]> {
    try {
      const { data, error } = await supabase
        .from('watchlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false })

      if (error) {
        console.error('Error fetching watchlist:', error)
        throw new Error('Failed to fetch watchlist')
      }

      return (data || []).map(item => ({
        id: item.id,
        ticker: item.ticker,
        name: item.name,
        price: item.price,
        change: item.change,
        changePercent: item.change_percent,
        market: item.market,
        currency: item.currency,
        addedAt: item.added_at
      }))
    } catch (error) {
      console.error('WatchlistService.getWatchlist error:', error)
      // Fallback to localStorage if database fails
      return this.getWatchlistFromLocalStorage()
    }
  }

  // Get watchlist with real-time data
  static async getWatchlistWithData(userId: string): Promise<WatchlistItem[]> {
    try {
      const watchlist = await this.getWatchlist(userId)
      
      if (watchlist.length === 0) return watchlist

      // Fetch real-time prices for all items
      const tickers = watchlist.map(item => item.ticker)
      const marketData = await multiApiStockService.getMultipleStocks(tickers)
      
      // Update watchlist with real-time data
      const updatedWatchlist = watchlist.map(item => {
        const marketItem = marketData.find(data => data.symbol === item.ticker)
        if (marketItem) {
          return {
            ...item,
            price: marketItem.price,
            change: marketItem.change,
            changePercent: marketItem.changePercent
          }
        }
        return item
      })

      // Update database with new prices
      await this.updateWatchlistPrices(updatedWatchlist)

      return updatedWatchlist
    } catch (error) {
      console.error('WatchlistService.getWatchlistWithData error:', error)
      return this.getWatchlistFromLocalStorage()
    }
  }

  // Add item to watchlist
  static async addToWatchlist(
    userId: string,
    ticker: string,
    name: string,
    market: string = 'US',
    currency: string = 'USD'
  ): Promise<{ success: boolean; message: string; item?: WatchlistItem }> {
    try {
      // Check if item already exists
      const { data: existing } = await supabase
        .from('watchlist_items')
        .select('id')
        .eq('user_id', userId)
        .eq('ticker', ticker.toUpperCase())
        .eq('market', market)
        .single()

      if (existing) {
        return { 
          success: false, 
          message: `${ticker} is already in your watchlist` 
        }
      }

      const { data, error } = await supabase
        .from('watchlist_items')
        .insert({
          user_id: userId,
          ticker: ticker.toUpperCase(),
          name: name || ticker.toUpperCase(),
          market,
          currency
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding watchlist item:', error)
        return { success: false, message: 'Failed to save watchlist item' }
      }

      const newItem: WatchlistItem = {
        id: data.id,
        ticker: data.ticker,
        name: data.name,
        price: data.price,
        change: data.change,
        changePercent: data.change_percent,
        market: data.market,
        currency: data.currency,
        addedAt: data.added_at
      }

      return { 
        success: true, 
        message: `${ticker} added to watchlist!`,
        item: newItem
      }
    } catch (error) {
      console.error('WatchlistService.addToWatchlist error:', error)
      return { success: false, message: 'Failed to save watchlist item' }
    }
  }

  // Remove item from watchlist
  static async removeFromWatchlist(
    itemId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('watchlist_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error removing watchlist item:', error)
        return { success: false, message: 'Failed to remove watchlist item' }
      }

      return { success: true, message: 'Item removed from watchlist!' }
    } catch (error) {
      console.error('WatchlistService.removeFromWatchlist error:', error)
      return { success: false, message: 'Failed to remove watchlist item' }
    }
  }

  // Update watchlist prices in database
  private static async updateWatchlistPrices(watchlist: WatchlistItem[]): Promise<void> {
    try {
      for (const item of watchlist) {
        await supabase
          .from('watchlist_items')
          .update({
            price: item.price,
            change: item.change,
            change_percent: item.changePercent
          })
          .eq('id', item.id)
      }
    } catch (error) {
      console.error('Error updating watchlist prices:', error)
    }
  }

  // Get user plan
  static async getUserPlan(userId: string): Promise<UserPlan | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('plan')
        .eq('id', userId)
        .single()

      if (error || !user) {
        console.error('Error fetching user plan:', error)
        return PLANS.free // Default to free plan
      }

      return PLANS[user.plan] || PLANS.free
    } catch (error) {
      console.error('WatchlistService.getUserPlan error:', error)
      return PLANS.free
    }
  }

  // Check if user can add more items
  static async canAddItem(userId: string): Promise<{ canAdd: boolean; reason?: string }> {
    try {
      const plan = await this.getUserPlan(userId)
      if (!plan) {
        return { canAdd: false, reason: 'Unable to verify user plan' }
      }

      if (plan.maxWatchlistItems === -1) {
        return { canAdd: true }
      }

      const currentCount = await this.getWatchlistCount(userId)
      if (currentCount >= plan.maxWatchlistItems) {
        return { 
          canAdd: false, 
          reason: `You've reached the limit of ${plan.maxWatchlistItems} items for your ${plan.name} plan` 
        }
      }

      return { canAdd: true }
    } catch (error) {
      console.error('WatchlistService.canAddItem error:', error)
      return { canAdd: false, reason: 'Error checking limits' }
    }
  }

  // Get current watchlist count
  private static async getWatchlistCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('watchlist_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (error) {
        console.error('Error getting watchlist count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('WatchlistService.getWatchlistCount error:', error)
      return 0
    }
  }

  // Fallback methods for localStorage (for backward compatibility)
  private static getWatchlistFromLocalStorage(): WatchlistItem[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error loading watchlist from localStorage:', error)
      return []
    }
  }

  static saveToLocalStorage(watchlist: WatchlistItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(watchlist))
    } catch (error) {
      console.error('Error saving watchlist to localStorage:', error)
    }
  }

  // Migrate data from localStorage to database
  static async migrateFromLocalStorage(userId: string): Promise<void> {
    try {
      const localWatchlist = this.getWatchlistFromLocalStorage()
      if (localWatchlist.length === 0) return

      // Get existing database watchlist
      const dbWatchlist = await this.getWatchlist(userId)
      const existingTickers = new Set(dbWatchlist.map(item => `${item.ticker}-${item.market}`))

      // Add items that don't exist in database
      for (const item of localWatchlist) {
        const key = `${item.ticker}-${item.market}`
        if (!existingTickers.has(key)) {
          await this.addToWatchlist(
            userId,
            item.ticker,
            item.name,
            item.market,
            item.currency
          )
        }
      }

      // Clear localStorage after successful migration
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('Watchlist data migrated from localStorage to database')
    } catch (error) {
      console.error('Error migrating watchlist data:', error)
    }
  }

  // Data validation methods (keeping from original service)
  static validateDataIntegrity(): { valid: boolean; message: string } {
    try {
      const watchlist = this.getWatchlistFromLocalStorage()
      
      if (!Array.isArray(watchlist)) {
        return { valid: false, message: 'Watchlist data is corrupted. Resetting to default.' }
      }

      const hasInvalidItems = watchlist.some(item => 
        !item.id || !item.ticker || typeof item.price !== 'number'
      )

      if (hasInvalidItems) {
        return { valid: false, message: 'Some watchlist items have invalid data. Cleaning up...' }
      }

      return { valid: true, message: 'Watchlist data is valid' }
    } catch (error) {
      return { valid: false, message: 'Error validating watchlist data' }
    }
  }

  static validateWatchlistData(): { valid: boolean; message: string } {
    try {
      const watchlist = this.getWatchlistFromLocalStorage()
      
      if (!Array.isArray(watchlist)) {
        localStorage.removeItem(this.STORAGE_KEY)
        return { valid: false, message: 'Watchlist data was corrupted and has been reset.' }
      }

      return { valid: true, message: 'Watchlist data is valid' }
    } catch (error) {
      localStorage.removeItem(this.STORAGE_KEY)
      return { valid: false, message: 'Watchlist data was corrupted and has been reset.' }
    }
  }

  static enforceLimits(): { removed: number; message: string } {
    try {
      const watchlist = this.getWatchlistFromLocalStorage()
      const freeLimit = 5
      
      if (watchlist.length <= freeLimit) {
        return { removed: 0, message: 'Watchlist is within limits' }
      }

      const itemsToKeep = watchlist.slice(0, freeLimit)
      this.saveToLocalStorage(itemsToKeep)
      
      return { 
        removed: watchlist.length - freeLimit, 
        message: `Removed ${watchlist.length - freeLimit} items to comply with free plan limits` 
      }
    } catch (error) {
      return { removed: 0, message: 'Error enforcing limits' }
    }
  }
}
