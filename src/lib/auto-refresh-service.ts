/**
 * Auto Refresh Service
 * 
 * Automatically refreshes all data every 2 seconds in the background
 * without affecting user experience or causing page reloads
 */

import { WatchlistService } from './watchlist'
import { DatabaseFirstService } from './database-first-service'
import { multiApiStockService } from './multi-api-stock-service'
import { MLPredictionModel } from './ml-prediction-model'

export interface RefreshData {
  portfolio: any[]
  watchlist: any[]
  marketData: any
  mlPredictions: any[]
  lastUpdated: string
}

export class AutoRefreshService {
  private static instance: AutoRefreshService
  private refreshInterval: NodeJS.Timeout | null = null
  private isRefreshing: boolean = false
  private refreshRate: number = 2000 // 2 seconds
  private subscribers: Set<(data: RefreshData) => void> = new Set()
  private lastRefreshData: RefreshData | null = null

  private constructor() {
    console.log('🔄 Auto Refresh Service initialized')
  }

  static getInstance(): AutoRefreshService {
    if (!AutoRefreshService.instance) {
      AutoRefreshService.instance = new AutoRefreshService()
    }
    return AutoRefreshService.instance
  }

  /**
   * Start automatic background refresh
   */
  startAutoRefresh(): void {
    if (this.refreshInterval) {
      console.log('🔄 Auto refresh already running')
      return
    }

    console.log('🚀 Starting auto refresh every 2 seconds...')
    
    // Initial refresh
    this.performRefresh()
    
    // Set up interval
    this.refreshInterval = setInterval(() => {
      this.performRefresh()
    }, this.refreshRate)
  }

  /**
   * Stop automatic background refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      console.log('⏹️ Stopping auto refresh')
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

  /**
   * Subscribe to refresh updates
   */
  subscribe(callback: (data: RefreshData) => void): () => void {
    this.subscribers.add(callback)
    
    // Send current data if available
    if (this.lastRefreshData) {
      callback(this.lastRefreshData)
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Perform background refresh without affecting UI
   */
  private async performRefresh(): Promise<void> {
    if (this.isRefreshing) {
      console.log('⏳ Refresh already in progress, skipping...')
      return
    }

    this.isRefreshing = true
    
    try {
      console.log('🔄 Performing background refresh...')
      
      // Refresh all data types in parallel
      const [portfolio, watchlist, marketData, mlPredictions] = await Promise.allSettled([
        this.refreshPortfolioData(),
        this.refreshWatchlistData(),
        this.refreshMarketData(),
        this.refreshMLPredictions()
      ])

      const refreshData: RefreshData = {
        portfolio: portfolio.status === 'fulfilled' ? portfolio.value : [],
        watchlist: watchlist.status === 'fulfilled' ? watchlist.value : [],
        marketData: marketData.status === 'fulfilled' ? marketData.value : null,
        mlPredictions: mlPredictions.status === 'fulfilled' ? mlPredictions.value : [],
        lastUpdated: new Date().toISOString()
      }

      this.lastRefreshData = refreshData
      
      // Notify all subscribers
      this.subscribers.forEach(callback => {
        try {
          callback(refreshData)
        } catch (error) {
          console.error('Error in refresh subscriber:', error)
        }
      })

      console.log('✅ Background refresh completed successfully')
      
    } catch (error) {
      console.error('❌ Error during background refresh:', error)
    } finally {
      this.isRefreshing = false
    }
  }

  /**
   * Refresh portfolio data
   */
  private async refreshPortfolioData(): Promise<any[]> {
    try {
      console.log('📊 Refreshing portfolio data...')
      
      // Get portfolio from database
      const portfolio = await DatabaseFirstService.getPortfolio()
      
      if (portfolio.length === 0) {
        return []
      }

      // Update prices for each portfolio item
      const updatedPortfolio = await Promise.all(
        portfolio.map(async (item) => {
          try {
            const stockData = await multiApiStockService.getStockQuote(item.ticker)
            
            if (stockData && stockData.price) {
              const currentPrice = Number(stockData.price) || 0
              const shares = Number(item.shares) || 0
              const avgPrice = Number(item.avgPrice) || 0
              const totalValue = shares * currentPrice
              const totalInvested = shares * avgPrice
              const gainLoss = totalValue - totalInvested
              const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0
              
              // Calculate previous close for day change calculation
              const change = Number(stockData.change) || 0
              const previousClose = currentPrice - change

              const updatedItem = {
                ...item,
                currentPrice,
                previousClose, // Add previous close for day change calculation
                totalValue,
                gainLoss,
                gainLossPercent,
                change,
                changePercent: Number(stockData.changePercent) || 0,
                lastUpdated: new Date().toISOString()
              }

              console.log(`✅ Updated ${item.ticker}: $${currentPrice} (prev: $${previousClose}, change: $${change})`)
              return updatedItem
            }
          } catch (error) {
            console.warn(`Failed to refresh ${item.ticker}:`, error)
          }
          
          return item
        })
      )

      // Update localStorage cache
      localStorage.setItem('oryn_portfolio', JSON.stringify(updatedPortfolio))
      localStorage.setItem('oryn_portfolio_last_modified', new Date().toISOString())

      // Dispatch portfolio update event
      window.dispatchEvent(new CustomEvent('portfolioUpdated', { 
        detail: { portfolio: updatedPortfolio } 
      }))

      console.log(`✅ Portfolio refreshed: ${updatedPortfolio.length} items`)
      return updatedPortfolio

    } catch (error) {
      console.error('❌ Error refreshing portfolio:', error)
      return []
    }
  }

  /**
   * Refresh watchlist data
   */
  private async refreshWatchlistData(): Promise<any[]> {
    try {
      console.log('📊 Refreshing watchlist data...')
      
      // Get watchlist with real-time data
      const watchlist = await WatchlistService.getWatchlistWithData()
      
      console.log(`✅ Watchlist refreshed: ${watchlist.length} items`)
      return watchlist

    } catch (error) {
      console.error('❌ Error refreshing watchlist:', error)
      return []
    }
  }

  /**
   * Refresh market data
   */
  private async refreshMarketData(): Promise<any> {
    try {
      console.log('📊 Refreshing market data...')
      
      // Get market status for major markets
      const markets = ['US', 'IN', 'GB', 'JP', 'AU', 'CA', 'DE', 'FR']
      const marketData = {}
      
      for (const market of markets) {
        try {
          const response = await fetch(`/api/stock/market-status?market=${market}`)
          if (response.ok) {
            const data = await response.json()
            marketData[market] = data
            console.log(`✅ Market ${market}: ${data.marketStatus || 'unknown'}`)
          } else {
            console.warn(`❌ Failed to get market status for ${market}: ${response.status}`)
          }
        } catch (error) {
          console.warn(`❌ Error fetching market ${market}:`, error)
        }
      }

      console.log(`✅ Market data refreshed for ${Object.keys(marketData).length} markets`)
      return marketData

    } catch (error) {
      console.error('❌ Error refreshing market data:', error)
      return null
    }
  }

  /**
   * Refresh ML predictions
   */
  private async refreshMLPredictions(): Promise<any[]> {
    try {
      console.log('🤖 Refreshing ML predictions...')
      
      // Get diverse symbols from different markets for ML predictions
      const symbols = [
        // US stocks
        'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'AMZN', 'META',
        // Indian stocks
        'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS',
        // European stocks
        'SAP.DE', 'ASML.AS', 'SHEL.L',
        // Asian stocks
        '7203.T', 'CBA.AX'
      ]
      
      const mlModel = MLPredictionModel.getInstance()
      
      const predictions = await mlModel.generatePredictions(symbols)
      
      console.log(`✅ ML predictions refreshed: ${predictions.length} predictions for ${symbols.length} symbols`)
      return predictions

    } catch (error) {
      console.error('❌ Error refreshing ML predictions:', error)
      return []
    }
  }

  /**
   * Get current refresh status
   */
  getRefreshStatus(): {
    isRunning: boolean
    isRefreshing: boolean
    refreshRate: number
    lastUpdated: string | null
    subscriberCount: number
  } {
    return {
      isRunning: this.refreshInterval !== null,
      isRefreshing: this.isRefreshing,
      refreshRate: this.refreshRate,
      lastUpdated: this.lastRefreshData?.lastUpdated || null,
      subscriberCount: this.subscribers.size
    }
  }

  /**
   * Update refresh rate
   */
  setRefreshRate(rate: number): void {
    this.refreshRate = rate
    
    if (this.refreshInterval) {
      this.stopAutoRefresh()
      this.startAutoRefresh()
    }
  }

  /**
   * Force immediate refresh
   */
  async forceRefresh(): Promise<RefreshData | null> {
    console.log('🔄 Force refresh requested...')
    await this.performRefresh()
    return this.lastRefreshData
  }

  /**
   * Get last refresh data
   */
  getLastRefreshData(): RefreshData | null {
    return this.lastRefreshData
  }
}
