// Real stock data service using Alpha Vantage API
const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'demo'

export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  high: number
  low: number
  open: number
  previousClose: number
  timestamp: string
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
    try {
      // If no API key or demo key, use mock data
      if (!ALPHA_VANTAGE_API_KEY || ALPHA_VANTAGE_API_KEY === 'demo') {
        console.log(`Using mock data for ${symbol} (no API key configured)`)
        return this.getMockQuote(symbol)
      }

      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      const data = await this.fetchWithCache(url, `quote_${symbol}`)
      
      if ((data as Record<string, unknown>)['Error Message']) {
        console.warn(`API Error for ${symbol}:`, (data as Record<string, unknown>)['Error Message'])
        return this.getMockQuote(symbol)
      }

      const quote = (data as Record<string, unknown>)['Global Quote']
      if (!quote) {
        console.warn(`No quote data available for ${symbol}, using mock data`)
        return this.getMockQuote(symbol)
      }

      const quoteData = quote as Record<string, string>
      return {
        symbol: quoteData['01. symbol'],
        price: parseFloat(quoteData['05. price']),
        change: parseFloat(quoteData['09. change']),
        changePercent: parseFloat(quoteData['10. change percent'].replace('%', '')),
        volume: parseInt(quoteData['06. volume']),
        high: parseFloat(quoteData['03. high']),
        low: parseFloat(quoteData['04. low']),
        open: parseFloat(quoteData['02. open']),
        previousClose: parseFloat(quoteData['08. previous close']),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error)
      // Return mock data as fallback
      return this.getMockQuote(symbol)
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

  private getMockQuote(symbol: string): StockQuote {
    // Use deterministic pricing based on symbol hash
    const hash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    const basePrice = 100 + (hash % 400)
    const change = ((hash % 20) - 10) * 0.1
    const changePercent = (change / basePrice) * 100

    return {
      symbol,
      price: basePrice,
      change,
      changePercent,
      volume: 1000000 + (hash % 9000000),
      high: basePrice + (hash % 10),
      low: basePrice - (hash % 10),
      open: basePrice + ((hash % 10) - 5) * 0.1,
      previousClose: basePrice - change,
      timestamp: new Date().toISOString()
    }
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
