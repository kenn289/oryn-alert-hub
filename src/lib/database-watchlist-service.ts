import { supabase } from './supabase'
import { WatchlistItem } from './watchlist'

export interface DatabaseWatchlistItem {
  id: string
  user_id: string
  ticker: string
  name: string
  price: number
  change: number
  change_percent: number
  currency?: string
  exchange?: string
  market?: string
  sector?: string
  added_at: string
  updated_at: string
}

export class DatabaseWatchlistService {
  /**
   * Get user's watchlist from database
   */
  static async getWatchlist(userId: string): Promise<WatchlistItem[]> {
    try {
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false })

      if (error) {
        console.error('Error fetching watchlist from database:', error)
        return []
      }

      return data.map(item => ({
        id: item.id,
        ticker: item.ticker,
        name: item.name,
        price: item.price,
        change: item.change,
        changePercent: item.change_percent,
        currency: item.currency,
        exchange: item.exchange,
        market: item.market,
        addedAt: item.added_at
      }))
    } catch (error) {
      console.error('Error fetching watchlist:', error)
      return []
    }
  }

  /**
   * Add stock to user's watchlist in database
   */
  static async addToWatchlist(
    userId: string, 
    ticker: string, 
    name: string, 
    market?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Clean and validate ticker
      const cleanTicker = ticker.trim().toUpperCase()
      if (!cleanTicker || cleanTicker.length === 0) {
        return { success: false, message: 'Invalid ticker symbol' }
      }

      // Add market suffix if needed
      let finalTicker = cleanTicker
      if (market) {
        const marketCode = market.toUpperCase()
        if (!cleanTicker.includes('.')) {
          const suffix = this.getMarketSuffix(marketCode, cleanTicker)
          finalTicker = `${cleanTicker}${suffix}`
        }
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from('watchlists')
        .select('ticker')
        .eq('user_id', userId)
        .eq('ticker', finalTicker)
        .single()

      if (existing) {
        return { success: false, message: `${finalTicker} is already in your watchlist` }
      }

      // Insert new watchlist item
      const { error } = await supabase
        .from('watchlists')
        .insert({
          user_id: userId,
          ticker: finalTicker,
          name: name.trim() || `${finalTicker} Inc.`,
          market: market?.toUpperCase()
        })

      if (error) {
        console.error('Error adding to watchlist:', error)
        return { success: false, message: 'Failed to add to watchlist' }
      }

      return { success: true, message: `Added ${finalTicker} to watchlist` }
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      return { success: false, message: 'Failed to add to watchlist' }
    }
  }

  /**
   * Remove stock from user's watchlist
   */
  static async removeFromWatchlist(
    userId: string, 
    ticker: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', userId)
        .eq('ticker', ticker.toUpperCase())

      if (error) {
        console.error('Error removing from watchlist:', error)
        return { success: false, message: 'Failed to remove from watchlist' }
      }

      return { success: true, message: `Removed ${ticker.toUpperCase()} from watchlist` }
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      return { success: false, message: 'Failed to remove from watchlist' }
    }
  }

  /**
   * Update stock prices in watchlist
   */
  static async updateWatchlistPrices(
    userId: string, 
    priceUpdates: Array<{
      ticker: string
      price: number
      change: number
      changePercent: number
      currency?: string
      exchange?: string
    }>
  ): Promise<void> {
    try {
      for (const update of priceUpdates) {
        await supabase
          .from('watchlists')
          .update({
            price: update.price,
            change: update.change,
            change_percent: update.changePercent,
            currency: update.currency,
            exchange: update.exchange,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('ticker', update.ticker)
      }
    } catch (error) {
      console.error('Error updating watchlist prices:', error)
    }
  }

  /**
   * Clear user's entire watchlist
   */
  static async clearWatchlist(userId: string): Promise<void> {
    try {
      await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', userId)
    } catch (error) {
      console.error('Error clearing watchlist:', error)
    }
  }

  /**
   * Sync localStorage watchlist to database
   */
  static async syncLocalToDatabase(userId: string): Promise<void> {
    try {
      // Get localStorage watchlist
      const localWatchlist = JSON.parse(localStorage.getItem('oryn_watchlist') || '[]')
      
      const localTickers = new Set(localWatchlist.map((i: any) => i.ticker))

      // One-time consolidation: if DB has multiple conflicting sets, keep union, then persist DB as source of truth
      const dbWatchlist = await this.getWatchlist(userId)
      const dbTickers = new Set(dbWatchlist.map(i => i.ticker))
      const union = new Set<string>([...localTickers, ...dbTickers])

      // Clear DB and insert union minimal set to ensure consistent baseline
      await this.clearWatchlist(userId)
      for (const ticker of union) {
        const local = localWatchlist.find((i: any) => i.ticker === ticker)
        const name = local?.name || ticker
        const market = local?.market
        await this.addToWatchlist(userId, ticker, name, market)
      }

      // Update localStorage from DB to finalize consolidation
      const fresh = await this.getWatchlist(userId)
      localStorage.setItem('oryn_watchlist', JSON.stringify(fresh))
      console.log(`✅ Watchlist consolidation complete. ${fresh.length} items unified.`)
    } catch (error) {
      console.error('Error syncing watchlist:', error)
    }
  }

  /**
   * Sync database watchlist to localStorage (for offline access)
   */
  static async syncDatabaseToLocal(userId: string): Promise<void> {
    try {
      const dbWatchlist = await this.getWatchlist(userId)
      
      if (dbWatchlist.length > 0) {
        localStorage.setItem('oryn_watchlist', JSON.stringify(dbWatchlist))
        console.log(`✅ Synced ${dbWatchlist.length} items from database to localStorage`)
      }
    } catch (error) {
      console.error('Error syncing database to local:', error)
    }
  }

  private static getMarketSuffix(market: string, symbol: string): string {
    if (symbol.includes('.')) return ''
    if (market === 'IN') {
      // If BSE numeric code, use .BO
      if (/^\d+$/.test(symbol)) return '.BO'
      return '.NS'
    }
    const suffixMap: Record<string, string> = {
      US: '', GB: '.L', UK: '.L', JP: '.T', AU: '.AX', CA: '.TO', DE: '.DE', FR: '.PA'
    }
    return suffixMap[market] ?? ''
  }
}

/**
 * User preferences service
 */
export class UserPreferencesService {
  /**
   * Get user preferences
   */
  static async getPreferences(userId: string): Promise<{
    currency_preference: string
    theme_preference: string
    notification_settings: any
  }> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user preferences:', error)
        return {
          currency_preference: 'USD',
          theme_preference: 'system',
          notification_settings: {}
        }
      }

      return data || {
        currency_preference: 'USD',
        theme_preference: 'system',
        notification_settings: {}
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
      return {
        currency_preference: 'USD',
        theme_preference: 'system',
        notification_settings: {}
      }
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(
    userId: string, 
    preferences: {
      currency_preference?: string
      theme_preference?: string
      notification_settings?: any
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error updating user preferences:', error)
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
    }
  }
}