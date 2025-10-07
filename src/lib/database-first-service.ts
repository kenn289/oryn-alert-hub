/**
 * Database-First Service
 * 
 * This service ensures Supabase is the single source of truth.
 * localStorage is only used as a cache for offline access.
 */

import { DatabasePortfolioService } from './database-portfolio-service'
import { DatabaseWatchlistService } from './database-watchlist-service'

export class DatabaseFirstService {
  /**
   * Load portfolio data - Database first, localStorage as cache
   */
  static async getPortfolio(userId: string): Promise<any[]> {
    try {
      // 1. Try to load from database (primary source)
      console.log('📊 Loading portfolio from database (primary source)')
      const dbPortfolio = await DatabasePortfolioService.getPortfolio(userId)
      
      // 2. Cache in localStorage for offline access
      if (dbPortfolio.length > 0) {
        localStorage.setItem('oryn_portfolio', JSON.stringify(dbPortfolio))
        localStorage.setItem('oryn_portfolio_last_modified', Date.now().toString())
        console.log('✅ Portfolio cached to localStorage:', dbPortfolio.length, 'items')
      }
      
      return dbPortfolio
    } catch (error) {
      console.error('Database load failed, trying localStorage cache:', error)
      
      // 3. Fallback to localStorage cache if database fails
      const cachedData = localStorage.getItem('oryn_portfolio')
      if (cachedData) {
        try {
          const cached = JSON.parse(cachedData)
          console.log('📊 Using localStorage cache:', cached.length, 'items')
          return cached
        } catch (parseError) {
          console.error('Failed to parse cached data:', parseError)
        }
      }
      
      return []
    }
  }

  /**
   * Load watchlist data - Database first, localStorage as cache
   */
  static async getWatchlist(userId: string): Promise<any[]> {
    try {
      // 1. Try to load from database (primary source)
      console.log('📊 Loading watchlist from database (primary source)')
      const dbWatchlist = await DatabaseWatchlistService.getWatchlist(userId)
      
      // 2. Cache in localStorage for offline access
      if (dbWatchlist.length > 0) {
        localStorage.setItem('oryn_watchlist', JSON.stringify(dbWatchlist))
        localStorage.setItem('oryn_watchlist_last_modified', Date.now().toString())
        console.log('✅ Watchlist cached to localStorage:', dbWatchlist.length, 'items')
      }
      
      return dbWatchlist
    } catch (error) {
      console.error('Database load failed, trying localStorage cache:', error)
      
      // 3. Fallback to localStorage cache if database fails
      const cachedData = localStorage.getItem('oryn_watchlist')
      if (cachedData) {
        try {
          const cached = JSON.parse(cachedData)
          console.log('📊 Using localStorage cache:', cached.length, 'items')
          return cached
        } catch (parseError) {
          console.error('Failed to parse cached data:', parseError)
        }
      }
      
      return []
    }
  }

  /**
   * Save portfolio item - Database first, then cache
   */
  static async addPortfolioItem(
    userId: string,
    ticker: string,
    name: string,
    shares: number,
    avgPrice: number,
    currentPrice: number,
    market: string = 'US',
    currency: string = 'USD',
    exchange?: string
  ): Promise<{ success: boolean; message: string; item?: any }> {
    try {
      // 1. Save to database (primary source)
      console.log('💾 Saving portfolio item to database (primary source)')
      const result = await DatabasePortfolioService.upsertPortfolioItem({
        userId,
        ticker,
        name,
        shares,
        avgPrice,
        currentPrice,
        market,
        currency,
        exchange
      })

      if (!result.success) {
        return result
      }

      // 2. Update localStorage cache
      const updatedPortfolio = await this.getPortfolio(userId)
      console.log('✅ Portfolio item saved to database and cached')

      return {
        success: true,
        message: `${ticker} added to portfolio!`,
        item: result.item
      }
    } catch (error) {
      console.error('Failed to save portfolio item:', error)
      return { success: false, message: 'Failed to save portfolio item' }
    }
  }

  /**
   * Save watchlist item - Database first, then cache
   */
  static async addWatchlistItem(
    userId: string,
    ticker: string,
    name: string,
    market: string = 'US',
    currency: string = 'USD'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Save to database (primary source)
      console.log('💾 Saving watchlist item to database (primary source)')
      const result = await DatabaseWatchlistService.addToWatchlist(userId, ticker, name, market)

      if (!result.success) {
        return result
      }

      // 2. Update localStorage cache
      const updatedWatchlist = await this.getWatchlist(userId)
      console.log('✅ Watchlist item saved to database and cached')

      return result
    } catch (error) {
      console.error('Failed to save watchlist item:', error)
      return { success: false, message: 'Failed to save watchlist item' }
    }
  }

  /**
   * Remove portfolio item - Database first, then cache
   */
  static async removePortfolioItem(userId: string, ticker: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Remove from database (primary source)
      console.log('🗑️ Removing portfolio item from database (primary source)')
      const result = await DatabasePortfolioService.removePortfolioItem(userId, ticker)

      if (!result.success) {
        return result
      }

      // 2. Update localStorage cache
      const updatedPortfolio = await this.getPortfolio(userId)
      console.log('✅ Portfolio item removed from database and cache updated')

      return result
    } catch (error) {
      console.error('Failed to remove portfolio item:', error)
      return { success: false, message: 'Failed to remove portfolio item' }
    }
  }

  /**
   * Remove watchlist item - Database first, then cache
   */
  static async removeWatchlistItem(userId: string, ticker: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Remove from database (primary source)
      console.log('🗑️ Removing watchlist item from database (primary source)')
      const result = await DatabaseWatchlistService.removeFromWatchlist(userId, ticker)

      if (!result.success) {
        return result
      }

      // 2. Update localStorage cache
      const updatedWatchlist = await this.getWatchlist(userId)
      console.log('✅ Watchlist item removed from database and cache updated')

      return result
    } catch (error) {
      console.error('Failed to remove watchlist item:', error)
      return { success: false, message: 'Failed to remove watchlist item' }
    }
  }

  /**
   * Sync all data - Database is source of truth
   */
  static async syncAllData(userId: string): Promise<void> {
    try {
      console.log('🔄 Syncing all data from database (source of truth)')
      
      // Load fresh data from database
      const portfolio = await this.getPortfolio(userId)
      const watchlist = await this.getWatchlist(userId)
      
      console.log('✅ Data synced from database:', {
        portfolio: portfolio.length,
        watchlist: watchlist.length
      })
    } catch (error) {
      console.error('Failed to sync data:', error)
    }
  }
}
