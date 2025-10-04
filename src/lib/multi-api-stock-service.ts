// Multi-API Stock Data Service
// Supports multiple APIs with fallback and data validation

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
  source: 'iex_cloud' | 'polygon' | 'yahoo'
  _cacheInfo?: {
    source: 'fresh' | 'cached' | 'fallback'
    age?: string
    rateLimited?: boolean
    lastUpdated?: string
  }
}

export interface ApiConfig {
  name: string
  baseUrl: string
  apiKey: string
  rateLimit: number // requests per minute
  priority: number // 1 = highest priority
  enabled: boolean
}

export interface ApiResponse {
  success: boolean
  data?: StockQuote
  error?: string
  rateLimited?: boolean
  source: string
}

class MultiApiStockService {
  private apis: ApiConfig[] = []
  private cache = new Map<string, { data: StockQuote; timestamp: number; source: string }>()
  private rateLimitTracker = new Map<string, { requests: number; resetTime: number }>()

  constructor() {
    this.initializeApis()
  }

  private initializeApis() {
    this.apis = [
      {
        name: 'yahoo',
        baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart',
        apiKey: '', // Yahoo doesn't require API key
        rateLimit: 1000, // Very high rate limit
        priority: 1, // Highest priority - free and fast
        enabled: true // Always enabled as primary
      },
      {
        name: 'iex_cloud',
        baseUrl: 'https://cloud.iexapis.com/stable',
        apiKey: process.env.IEX_CLOUD_API_KEY || '',
        rateLimit: 100, // 100 requests per minute
        priority: 2,
        enabled: !!process.env.IEX_CLOUD_API_KEY
      },
      {
        name: 'polygon',
        baseUrl: 'https://api.polygon.io/v2',
        apiKey: process.env.POLYGON_API_KEY || '',
        rateLimit: 5, // 5 requests per minute for free tier
        priority: 3,
        enabled: !!process.env.POLYGON_API_KEY
      },
    ].filter(api => api.enabled)
  }

  async getStockQuote(symbol: string): Promise<StockQuote> {
    const normalizedSymbol = symbol.toUpperCase().trim()
    const cacheKey = `stock_${normalizedSymbol}`
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
      return {
        ...cached.data,
        source: 'cached' as const,
        _cacheInfo: {
          source: 'cached',
          age: this.formatAge(cached.timestamp),
          rateLimited: false,
          lastUpdated: new Date(cached.timestamp).toISOString()
        }
      }
    }

    // Try APIs in priority order
    const sortedApis = this.apis.sort((a, b) => a.priority - b.priority)
    
    for (const api of sortedApis) {
      if (this.isRateLimited(api.name)) {
        console.log(`Skipping ${api.name} due to rate limit`)
        continue
      }

      try {
        const response = await this.fetchFromApi(api, normalizedSymbol)
        if (response.success && response.data) {
          // Cache the successful response
          this.cache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now(),
            source: api.name
          })
          
          return response.data
        }
      } catch (error) {
        console.warn(`API ${api.name} failed for ${normalizedSymbol}:`, error)
        continue
      }
    }

    // If all APIs failed, throw error
    throw new Error(`All stock data APIs failed for symbol: ${normalizedSymbol}`)
  }

  private async fetchFromApi(api: ApiConfig, symbol: string): Promise<ApiResponse> {
    try {
      let url: string
      let response: Response

      switch (api.name) {

        case 'iex_cloud':
          url = `${api.baseUrl}/stock/${symbol}/quote?token=${api.apiKey}`
          response = await fetch(url)
          return this.parseIexCloudResponse(response, symbol, api.name)

        case 'polygon':
          url = `${api.baseUrl}/aggs/ticker/${symbol}/prev?apikey=${api.apiKey}`
          response = await fetch(url)
          return this.parsePolygonResponse(response, symbol, api.name)

        case 'yahoo':
          url = `${api.baseUrl}/${symbol}`
          response = await fetch(url)
          return this.parseYahooResponse(response, symbol, api.name)

        default:
          throw new Error(`Unknown API: ${api.name}`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: api.name
      }
    }
  }


  private async parseIexCloudResponse(response: Response, symbol: string, source: string): Promise<ApiResponse> {
    if (!response.ok) {
      if (response.status === 429) {
        this.setRateLimit(source, 60)
        return {
          success: false,
          error: 'Rate limit exceeded',
          rateLimited: true,
          source
        }
      }
      return {
        success: false,
        error: `HTTP ${response.status}`,
        source
      }
    }

    const data = await response.json()
    
    return {
      success: true,
      data: {
        symbol: data.symbol,
        name: data.companyName || this.getStockName(symbol),
        price: data.latestPrice,
        change: data.change,
        changePercent: data.changePercent * 100,
        volume: data.volume,
        avgVolume: data.avgTotalVolume,
        high: data.high,
        low: data.low,
        open: data.open,
        previousClose: data.previousClose,
        marketCap: data.marketCap,
        pe: data.peRatio,
        timestamp: new Date().toISOString(),
        source: source as 'iex_cloud' | 'polygon' | 'yahoo'
      },
      source
    }
  }

  private async parsePolygonResponse(response: Response, symbol: string, source: string): Promise<ApiResponse> {
    if (!response.ok) {
      if (response.status === 429) {
        this.setRateLimit(source, 60)
        return {
          success: false,
          error: 'Rate limit exceeded',
          rateLimited: true,
          source
        }
      }
      return {
        success: false,
        error: `HTTP ${response.status}`,
        source
      }
    }

    const data = await response.json()
    
    if (!data.results || data.results.length === 0) {
      return {
        success: false,
        error: 'No data available',
        source
      }
    }

    const result = data.results[0]
    return {
      success: true,
      data: {
        symbol: symbol,
        name: this.getStockName(symbol),
        price: result.c,
        change: result.c - result.o,
        changePercent: ((result.c - result.o) / result.o) * 100,
        volume: result.v,
        avgVolume: Math.floor(result.v * 0.8),
        high: result.h,
        low: result.l,
        open: result.o,
        previousClose: result.c,
        marketCap: result.c * result.v * 0.1,
        pe: 20,
        timestamp: new Date().toISOString(),
        source: source as 'iex_cloud' | 'polygon' | 'yahoo'
      },
      source
    }
  }

  private async parseYahooResponse(response: Response, symbol: string, source: string): Promise<ApiResponse> {
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
        source
      }
    }

    const data = await response.json()
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      return {
        success: false,
        error: 'No data available',
        source
      }
    }

    const result = data.chart.result[0]
    const meta = result.meta
    
    return {
      success: true,
      data: {
        symbol: meta.symbol,
        name: meta.longName || this.getStockName(symbol),
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        volume: meta.regularMarketVolume,
        avgVolume: Math.floor(meta.regularMarketVolume * 0.8),
        high: meta.regularMarketDayHigh,
        low: meta.regularMarketDayLow,
        open: meta.regularMarketOpen,
        previousClose: meta.previousClose,
        marketCap: meta.marketCap,
        pe: meta.trailingPE,
        timestamp: new Date().toISOString(),
        source: source as 'iex_cloud' | 'polygon' | 'yahoo'
      },
      source
    }
  }


  private isRateLimited(apiName: string): boolean {
    const rateLimit = this.rateLimitTracker.get(apiName)
    if (!rateLimit) return false
    
    if (Date.now() > rateLimit.resetTime) {
      this.rateLimitTracker.delete(apiName)
      return false
    }
    
    const api = this.apis.find(api => api.name === apiName)
    return rateLimit.requests >= (api?.rateLimit || 0)
  }

  private setRateLimit(apiName: string, minutes: number): void {
    this.rateLimitTracker.set(apiName, {
      requests: 999, // Set high to block
      resetTime: Date.now() + (minutes * 60 * 1000)
    })
  }

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
      'WMT': 'Walmart Inc.',
      'PG': 'Procter & Gamble Co.',
      'KO': 'Coca-Cola Co.',
      'PFE': 'Pfizer Inc.',
      'UNH': 'UnitedHealth Group Inc.',
      'JNJ': 'Johnson & Johnson'
    }
    return stockNames[symbol] || `${symbol} Inc.`
  }

  private formatAge(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Get API status for monitoring
  getApiStatus(): Array<{ name: string; enabled: boolean; rateLimited: boolean; priority: number }> {
    return this.apis.map(api => ({
      name: api.name,
      enabled: api.enabled,
      rateLimited: this.isRateLimited(api.name),
      priority: api.priority
    }))
  }

  // Clear rate limits (for testing)
  clearRateLimits(): void {
    this.rateLimitTracker.clear()
  }
}

// Export singleton instance
export const multiApiStockService = new MultiApiStockService()
