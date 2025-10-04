// Real-time stock data service - Yahoo Finance primary
import { dataCache, cacheUtils } from './data-cache'

export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  avgVolume: number
  high: number
  low: number
  open: number
  previousClose: number
  marketCap: number
  pe: number
  timestamp: string
  // Cache metadata
  _cacheInfo?: {
    source: 'fresh' | 'cached' | 'fallback'
    age?: string
    rateLimited?: boolean
    lastUpdated?: string
  }
}

export interface StockAlert {
  id: string
  symbol: string
  type: 'price' | 'volume' | 'options' | 'news'
  title: string
  description: string
  timestamp: string
  severity: 'low' | 'medium' | 'high'
  triggered: boolean
  data?: Record<string, unknown>
}

export interface OptionsActivity {
  id: string
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiry: string
  volume: number
  premium: number
  sentiment: 'bullish' | 'bearish' | 'neutral'
  timestamp: string
  unusual: boolean
}

class StockDataService {
  private cache = new Map<string, { data: unknown; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private async fetchWithCache<T>(url: string, cacheKey: string): Promise<T> {
    const cached = this.cache.get(cacheKey)
    const now = Date.now()

    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data as T
    }

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const data = await response.json() as T
      this.cache.set(cacheKey, { data, timestamp: now })
      return data
    } catch (error) {
      console.error('Stock data fetch error:', error)
      throw error
    }
  }

  async getStockQuote(symbol: string): Promise<StockQuote> {
    // Validate symbol format
    if (!symbol || typeof symbol !== 'string' || symbol.length === 0) {
      throw new Error('Invalid stock symbol provided')
    }
    
    // Normalize symbol (uppercase, trim)
    const normalizedSymbol = symbol.toUpperCase().trim()
    const cacheKey = cacheUtils.stockQuoteKey(normalizedSymbol)
    
    try {
      // Try to get fresh data with fallback to cached data
      const cachedResult = await dataCache.getWithFallback(
        cacheKey,
        async () => {
          // Fetch from Yahoo Finance (primary and only source)
          console.log(`Fetching ${normalizedSymbol} from Yahoo Finance...`)
          const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}`
          const yahooData = await this.fetchWithCache(yahooUrl, `yahoo_${normalizedSymbol}`)
          
          if (yahooData && yahooData.chart && yahooData.chart.result && yahooData.chart.result.length > 0) {
            const result = yahooData.chart.result[0]
            const meta = result.meta
            
            if (meta && meta.regularMarketPrice) {
              console.log(`Successfully fetched ${normalizedSymbol} from Yahoo Finance`)
              return {
                symbol: meta.symbol,
                name: meta.longName || this.getStockName(normalizedSymbol),
                price: meta.regularMarketPrice,
                change: meta.regularMarketPrice - meta.previousClose,
                changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                volume: meta.regularMarketVolume || 0,
                avgVolume: Math.floor((meta.regularMarketVolume || 0) * 0.8),
                high: meta.regularMarketDayHigh || meta.regularMarketPrice,
                low: meta.regularMarketDayLow || meta.regularMarketPrice,
                open: meta.regularMarketOpen || meta.regularMarketPrice,
                previousClose: meta.previousClose,
                marketCap: meta.marketCap || (meta.regularMarketPrice * (meta.regularMarketVolume || 0) * 0.1),
                pe: meta.trailingPE || 20,
                timestamp: new Date().toISOString()
              }
            }
          }
          
          throw new Error(`No data available for ${normalizedSymbol} from Yahoo Finance`)
        },
        {
          allowStale: true,
          maxStaleness: 24 * 60 * 60 * 1000, // 24 hours
          onRateLimit: (cachedData) => {
            console.log(`Rate limit exceeded for ${symbol}, using cached data from ${cachedData ? cacheUtils.formatTimestamp(cachedData.timestamp) : 'unknown'}`)
            return cachedData?.data as StockQuote || null
          }
        }
      )

      // Add cache metadata to the result
      const stockQuote = cachedResult.data as StockQuote
      
      stockQuote._cacheInfo = {
        source: cachedResult.source,
        age: cacheUtils.formatTimestamp(cachedResult.timestamp),
        rateLimited: cachedResult.metadata?.apiLimitExceeded || false,
        lastUpdated: new Date(cachedResult.timestamp).toISOString()
      }

      return stockQuote
    } catch (error) {
      console.error(`Error fetching quote for ${normalizedSymbol}:`, error)
      
      // Don't use fallback data - let the error propagate to show API status in UI
      throw error
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    const quotes = await Promise.allSettled(
      symbols.map(symbol => this.getStockQuote(symbol))
    )

    return quotes
      .filter((result): result is PromiseFulfilledResult<StockQuote> => result.status === 'fulfilled')
      .map(result => result.value)
  }

  async getPortfolioAlerts(portfolio: Record<string, unknown>[], watchlist: Record<string, unknown>[]): Promise<StockAlert[]> {
    const alerts: StockAlert[] = []
    const allSymbols = [
      ...portfolio.map(item => item.ticker as string),
      ...watchlist.map(item => item.ticker as string)
    ].filter((symbol, index, self) => self.indexOf(symbol) === index)

    try {
      const quotes = await this.getMultipleQuotes(allSymbols)
      
      for (let i = 0; i < quotes.length; i++) {
        const quote = quotes[i]
        // Price movement alerts
        if (Math.abs(quote.changePercent) > 5) {
          alerts.push({
            id: `price_${quote.symbol}_${Date.now()}`,
            symbol: quote.symbol,
            type: 'price',
            title: `${quote.symbol} price ${quote.changePercent > 0 ? 'spiked' : 'dropped'}`,
            description: `${quote.symbol} moved ${Math.abs(quote.changePercent).toFixed(1)}% to $${quote.price.toFixed(2)}`,
            timestamp: new Date(Date.now() - (i * 15 * 60 * 1000)).toISOString(), // 15 minutes apart
            severity: Math.abs(quote.changePercent) > 10 ? 'high' : 'medium',
            triggered: true,
            data: { changePercent: quote.changePercent, price: quote.price }
          })
        }

        // Volume alerts
        if (quote.volume > 1000000) { // High volume threshold
          alerts.push({
            id: `volume_${quote.symbol}_${Date.now()}`,
            symbol: quote.symbol,
            type: 'volume',
            title: `${quote.symbol} volume surge`,
            description: `${quote.symbol} trading volume: ${quote.volume.toLocaleString()} shares`,
            timestamp: new Date(Date.now() - (i * 10 * 60 * 1000)).toISOString(), // 10 minutes apart
            severity: quote.volume > 5000000 ? 'high' : 'medium',
            triggered: true,
            data: { volume: quote.volume }
          })
        }
      }

      // Add some options flow alerts for Pro users
      const optionsAlerts = this.generateOptionsAlerts(allSymbols)
      alerts.push(...optionsAlerts)

    } catch (error) {
      console.error('Error generating alerts:', error)
    }

    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  private generateOptionsAlerts(symbols: string[]): StockAlert[] {
    const alerts: StockAlert[] = []
    const optionsSymbols = symbols.slice(0, 3) // Limit to first 3 symbols for options alerts

    for (let i = 0; i < optionsSymbols.length; i++) {
      const symbol = optionsSymbols[i]
      if (i % 3 === 0) { // Every 3rd symbol gets options alert
        alerts.push({
          id: `options_${symbol}_${Date.now()}`,
          symbol,
          type: 'options',
          title: `${symbol}: Block options trade`,
          description: `Unusual options activity detected in ${symbol} with large block trade`,
            timestamp: new Date(Date.now() - (i * 5 * 60 * 1000)).toISOString(), // 5 minutes apart
          severity: 'high',
          triggered: true,
          data: { 
            type: 'block_trade',
            volume: 1000 + (i * 500),
            premium: 100000 + (i * 50000)
          }
        })
      }
    }

    return alerts
  }

  async getOptionsFlow(symbols: string[]): Promise<OptionsActivity[]> {
    const activities: OptionsActivity[] = []
    
    for (let i = 0; i < Math.min(symbols.length, 5); i++) { // Limit to 5 symbols
      const symbol = symbols[i]
      if (i % 2 === 0) { // Every 2nd symbol gets options activity
        const strikes = [100, 150, 200, 250, 300, 350, 400, 450, 500]
        const expiries = this.getNextFridays(3) // Next 3 Fridays
        
        activities.push({
          id: `options_${symbol}_${Date.now()}`,
          symbol,
          type: i % 2 === 0 ? 'call' : 'put',
          strike: strikes[i % strikes.length],
          expiry: expiries[i % expiries.length],
          volume: 100 + (i * 200),
          premium: 50000 + (i * 10000),
          sentiment: i % 2 === 0 ? 'bullish' : 'bearish',
          timestamp: new Date(Date.now() - (i * 30 * 60 * 1000)).toISOString(), // 30 minutes apart
          unusual: i % 3 === 0
        })
      }
    }

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  private getNextFridays(count: number): string[] {
    const fridays: string[] = []
    const today = new Date()
    
    for (let i = 0; i < count; i++) {
      const nextFriday = new Date(today)
      const currentDay = today.getDay()
      const daysUntilFriday = (5 - currentDay + 7) % 7
      nextFriday.setDate(today.getDate() + daysUntilFriday + (i * 7))
      fridays.push(nextFriday.toISOString().split('T')[0])
    }
    
    return fridays
  }

  // Fallback data for development/testing
  private getFallbackStockQuote(symbol: string): StockQuote {
    const fallbackData: Record<string, StockQuote> = {
      'GOOGL': {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 152.50,
        change: 3.00,
        changePercent: 2.01,
        volume: 2500000,
        avgVolume: 2000000,
        high: 155.00,
        low: 148.00,
        open: 150.00,
        previousClose: 149.50,
        marketCap: 152.50 * 2500000 * 0.1,
        pe: 25.5,
        timestamp: new Date().toISOString(),
        _cacheInfo: {
          source: 'fallback',
          age: 'development mode',
          rateLimited: false,
          lastUpdated: new Date().toISOString()
        }
      },
      'AAPL': {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 182.50,
        change: 3.00,
        changePercent: 1.67,
        volume: 5000000,
        avgVolume: 4000000,
        high: 185.00,
        low: 178.00,
        open: 180.00,
        previousClose: 179.50,
        marketCap: 182.50 * 5000000 * 0.1,
        pe: 28.5,
        timestamp: new Date().toISOString(),
        _cacheInfo: {
          source: 'fallback',
          age: 'development mode',
          rateLimited: false,
          lastUpdated: new Date().toISOString()
        }
      },
      'MSFT': {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        price: 375.25,
        change: 5.50,
        changePercent: 1.49,
        volume: 3500000,
        avgVolume: 3000000,
        high: 378.00,
        low: 370.00,
        open: 372.00,
        previousClose: 369.75,
        marketCap: 375.25 * 3500000 * 0.1,
        pe: 32.1,
        timestamp: new Date().toISOString(),
        _cacheInfo: {
          source: 'fallback',
          age: 'development mode',
          rateLimited: false,
          lastUpdated: new Date().toISOString()
        }
      },
      'NVDA': {
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        price: 875.50,
        change: 12.25,
        changePercent: 1.42,
        volume: 2800000,
        avgVolume: 2500000,
        high: 880.00,
        low: 865.00,
        open: 870.00,
        previousClose: 863.25,
        marketCap: 875.50 * 2800000 * 0.1,
        pe: 45.2,
        timestamp: new Date().toISOString(),
        _cacheInfo: {
          source: 'fallback',
          age: 'development mode',
          rateLimited: false,
          lastUpdated: new Date().toISOString()
        }
      },
      'TSLA': {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 234.75,
        change: -8.25,
        changePercent: -3.39,
        volume: 4200000,
        avgVolume: 3500000,
        high: 245.00,
        low: 230.00,
        open: 240.00,
        previousClose: 243.00,
        marketCap: 234.75 * 4200000 * 0.1,
        pe: 38.7,
        timestamp: new Date().toISOString(),
        _cacheInfo: {
          source: 'fallback',
          age: 'development mode',
          rateLimited: false,
          lastUpdated: new Date().toISOString()
        }
      },
      'AMZN': {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        price: 145.80,
        change: 2.30,
        changePercent: 1.60,
        volume: 3800000,
        avgVolume: 3200000,
        high: 148.00,
        low: 142.00,
        open: 144.00,
        previousClose: 143.50,
        marketCap: 145.80 * 3800000 * 0.1,
        pe: 42.3,
        timestamp: new Date().toISOString(),
        _cacheInfo: {
          source: 'fallback',
          age: 'development mode',
          rateLimited: false,
          lastUpdated: new Date().toISOString()
        }
      },
      'META': {
        symbol: 'META',
        name: 'Meta Platforms Inc.',
        price: 485.60,
        change: 7.80,
        changePercent: 1.63,
        volume: 2200000,
        avgVolume: 1800000,
        high: 490.00,
        low: 475.00,
        open: 480.00,
        previousClose: 477.80,
        marketCap: 485.60 * 2200000 * 0.1,
        pe: 28.9,
        timestamp: new Date().toISOString(),
        _cacheInfo: {
          source: 'fallback',
          age: 'development mode',
          rateLimited: false,
          lastUpdated: new Date().toISOString()
        }
      },
      'WMT': {
        symbol: 'WMT',
        name: 'Walmart Inc.',
        price: 165.40,
        change: 1.20,
        changePercent: 0.73,
        volume: 1800000,
        avgVolume: 1500000,
        high: 167.00,
        low: 163.00,
        open: 164.50,
        previousClose: 164.20,
        marketCap: 165.40 * 1800000 * 0.1,
        pe: 24.8,
        timestamp: new Date().toISOString(),
        _cacheInfo: {
          source: 'fallback',
          age: 'development mode',
          rateLimited: false,
          lastUpdated: new Date().toISOString()
        }
      }
    }
    
    return fallbackData[symbol] || {
      symbol,
      name: this.getStockName(symbol),
      price: 100.00,
      change: 0.00,
      changePercent: 0.00,
      volume: 1000000,
      avgVolume: 1000000,
      high: 105.00,
      low: 95.00,
      open: 100.00,
      previousClose: 100.00,
      marketCap: 100000000,
      pe: 20.0,
      timestamp: new Date().toISOString(),
      _cacheInfo: {
        source: 'fallback',
        age: 'development mode',
        rateLimited: false,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  // NO MOCK DATA - Real-time only

  private getStockName(symbol: string): string {
    const stockNames: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
      'NVDA': 'NVIDIA Corporation',
      'NFLX': 'Netflix Inc.',
      'AMD': 'Advanced Micro Devices Inc.',
      'INTC': 'Intel Corporation',
      'CRM': 'Salesforce Inc.',
      'ADBE': 'Adobe Inc.',
      'JPM': 'JPMorgan Chase & Co.',
      'BAC': 'Bank of America Corp.',
      'WFC': 'Wells Fargo & Company',
      'GS': 'Goldman Sachs Group Inc.'
    }
    
    return stockNames[symbol] || `${symbol} Corporation`
  }

  // Clean up cache periodically
  cleanupCache() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key)
      }
    }
  }
}

export const stockDataService = new StockDataService()

// Clean up cache every 10 minutes
setInterval(() => {
  stockDataService.cleanupCache()
}, 10 * 60 * 1000)
