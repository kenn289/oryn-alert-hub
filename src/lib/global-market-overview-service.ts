import { timezoneService } from './timezone-service'

export interface MarketOverview {
  market: string
  name: string
  flag: string
  currency: string
  status: 'open' | 'closed' | 'pre-market' | 'after-hours'
  isOpen: boolean
  currentTime: string
  nextOpen?: string
  nextClose?: string
  tradingHours: {
    open: string
    close: string
    days: string[]
  }
  lastUpdated: string
  error?: string
}

export interface GlobalMarketOverview {
  markets: MarketOverview[]
  totalMarkets: number
  openMarkets: number
  closedMarkets: number
  lastUpdated: string
  errors: string[]
}

export class GlobalMarketOverviewService {
  private static instance: GlobalMarketOverviewService
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

  static getInstance(): GlobalMarketOverviewService {
    if (!GlobalMarketOverviewService.instance) {
      GlobalMarketOverviewService.instance = new GlobalMarketOverviewService()
    }
    return GlobalMarketOverviewService.instance
  }

  /**
   * Get comprehensive global market overview with fallbacks
   */
  async getGlobalMarketOverview(): Promise<GlobalMarketOverview> {
    const cacheKey = 'global_market_overview'
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      console.log('🌍 Fetching global market overview...')
      
      const markets = await this.getAllMarketStatuses()
      const overview = this.buildMarketOverview(markets)
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: overview,
        timestamp: Date.now()
      })
      
      return overview
    } catch (error) {
      console.error('Error fetching global market overview:', error)
      return this.getFallbackMarketOverview()
    }
  }

  /**
   * Get status for a specific market with fallbacks
   */
  async getMarketStatus(market: string): Promise<MarketOverview> {
    try {
      const marketInfo = timezoneService.getMarketStatus(market)
      const isOpen = timezoneService.isMarketOpen(market)
      const currentTime = timezoneService.getMarketTime(market)
      const nextOpen = timezoneService.getNextMarketOpen(market)
      const nextClose = timezoneService.getNextMarketClose(market)

      return {
        market: market.toUpperCase(),
        name: this.getMarketName(market),
        flag: this.getMarketFlag(market),
        currency: this.getMarketCurrency(market),
        status: marketInfo,
        isOpen,
        currentTime: currentTime.toISOString(),
        nextOpen: nextOpen?.toISOString(),
        nextClose: nextClose?.toISOString(),
        tradingHours: this.getTradingHours(market),
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error getting market status for ${market}:`, error)
      return this.getFallbackMarketStatus(market)
    }
  }

  /**
   * Get all market statuses with error handling
   */
  private async getAllMarketStatuses(): Promise<MarketOverview[]> {
    const supportedMarkets = ['US', 'IN', 'GB', 'JP', 'AU', 'CA', 'DE', 'FR', 'BR', 'MX', 'SG', 'HK']
    const marketPromises = supportedMarkets.map(market => 
      this.getMarketStatus(market).catch(error => {
        console.error(`Failed to get status for ${market}:`, error)
        return this.getFallbackMarketStatus(market)
      })
    )

    const results = await Promise.allSettled(marketPromises)
    return results
      .filter((result): result is PromiseFulfilledResult<MarketOverview> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value)
  }

  /**
   * Build comprehensive market overview
   */
  private buildMarketOverview(markets: MarketOverview[]): GlobalMarketOverview {
    const openMarkets = markets.filter(market => market.isOpen).length
    const closedMarkets = markets.filter(market => !market.isOpen).length
    const errors = markets.filter(market => market.error).map(market => market.error!)

    return {
      markets,
      totalMarkets: markets.length,
      openMarkets,
      closedMarkets,
      lastUpdated: new Date().toISOString(),
      errors
    }
  }

  /**
   * Get fallback market overview when all else fails
   */
  private getFallbackMarketOverview(): GlobalMarketOverview {
    const fallbackMarkets: MarketOverview[] = [
      {
        market: 'US',
        name: 'United States',
        flag: '🇺🇸',
        currency: 'USD',
        status: 'closed',
        isOpen: false,
        currentTime: new Date().toISOString(),
        tradingHours: {
          open: '09:30',
          close: '16:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        },
        lastUpdated: new Date().toISOString(),
        error: 'Unable to fetch real-time data'
      },
      {
        market: 'IN',
        name: 'India',
        flag: '🇮🇳',
        currency: 'INR',
        status: 'closed',
        isOpen: false,
        currentTime: new Date().toISOString(),
        tradingHours: {
          open: '09:15',
          close: '15:30',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        },
        lastUpdated: new Date().toISOString(),
        error: 'Unable to fetch real-time data'
      }
    ]

    return {
      markets: fallbackMarkets,
      totalMarkets: fallbackMarkets.length,
      openMarkets: 0,
      closedMarkets: fallbackMarkets.length,
      lastUpdated: new Date().toISOString(),
      errors: ['Unable to fetch real-time market data']
    }
  }

  /**
   * Get fallback market status for a specific market
   */
  private getFallbackMarketStatus(market: string): MarketOverview {
    const marketConfig = this.getMarketConfig(market)
    
    return {
      market: market.toUpperCase(),
      name: marketConfig.name,
      flag: marketConfig.flag,
      currency: marketConfig.currency,
      status: 'closed',
      isOpen: false,
      currentTime: new Date().toISOString(),
      tradingHours: marketConfig.tradingHours,
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch real-time data'
    }
  }

  /**
   * Get market configuration
   */
  private getMarketConfig(market: string) {
    const configs: Record<string, any> = {
      'US': {
        name: 'United States',
        flag: '🇺🇸',
        currency: 'USD',
        tradingHours: {
          open: '09:30',
          close: '16:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      },
      'IN': {
        name: 'India',
        flag: '🇮🇳',
        currency: 'INR',
        tradingHours: {
          open: '09:15',
          close: '15:30',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      },
      'GB': {
        name: 'United Kingdom',
        flag: '🇬🇧',
        currency: 'GBP',
        tradingHours: {
          open: '08:00',
          close: '16:30',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      },
      'JP': {
        name: 'Japan',
        flag: '🇯🇵',
        currency: 'JPY',
        tradingHours: {
          open: '09:00',
          close: '15:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      },
      'AU': {
        name: 'Australia',
        flag: '🇦🇺',
        currency: 'AUD',
        tradingHours: {
          open: '10:00',
          close: '16:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      },
      'CA': {
        name: 'Canada',
        flag: '🇨🇦',
        currency: 'CAD',
        tradingHours: {
          open: '09:30',
          close: '16:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      },
      'DE': {
        name: 'Germany',
        flag: '🇩🇪',
        currency: 'EUR',
        tradingHours: {
          open: '09:00',
          close: '17:30',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      },
      'FR': {
        name: 'France',
        flag: '🇫🇷',
        currency: 'EUR',
        tradingHours: {
          open: '09:00',
          close: '17:30',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      }
    }

    return configs[market.toUpperCase()] || {
      name: market,
      flag: '🌍',
      currency: 'USD',
      tradingHours: {
        open: '09:00',
        close: '17:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    }
  }

  /**
   * Get market name
   */
  private getMarketName(market: string): string {
    return this.getMarketConfig(market).name
  }

  /**
   * Get market flag
   */
  private getMarketFlag(market: string): string {
    return this.getMarketConfig(market).flag
  }

  /**
   * Get market currency
   */
  private getMarketCurrency(market: string): string {
    return this.getMarketConfig(market).currency
  }

  /**
   * Get trading hours
   */
  private getTradingHours(market: string) {
    return this.getMarketConfig(market).tradingHours
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🧹 Global market overview cache cleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const globalMarketOverviewService = GlobalMarketOverviewService.getInstance()
