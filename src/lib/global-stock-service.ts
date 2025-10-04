"use client"

export interface GlobalStockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  currency: string
  exchange: string
  country: string
  sector?: string
  industry?: string
  lastUpdated: string
}

export interface MarketInfo {
  country: string
  currency: string
  exchange: string
  timezone: string
  isOpen: boolean
  nextOpen?: string
  nextClose?: string
  tradingHours: {
    open: string
    close: string
    days: string[]
  }
  currentTime: string
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours'
}

export class GlobalStockService {
  private static instance: GlobalStockService
  private cache: Map<string, { data: GlobalStockData; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): GlobalStockService {
    if (!GlobalStockService.instance) {
      GlobalStockService.instance = new GlobalStockService()
    }
    return GlobalStockService.instance
  }

  // Market configurations with accurate trading hours
  private readonly markets = {
    US: {
      currency: 'USD',
      exchanges: ['NYSE', 'NASDAQ', 'AMEX'],
      timezone: 'America/New_York',
      symbolSuffix: '',
      tradingHours: {
        open: '09:30',
        close: '16:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    },
    IN: {
      currency: 'INR',
      exchanges: ['NSE', 'BSE'],
      timezone: 'Asia/Kolkata',
      symbolSuffix: '.NS',
      tradingHours: {
        open: '09:15',
        close: '15:30',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    },
    UK: {
      currency: 'GBP',
      exchanges: ['LSE'],
      timezone: 'Europe/London',
      symbolSuffix: '.L',
      tradingHours: {
        open: '08:00',
        close: '16:30',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    },
    JP: {
      currency: 'JPY',
      exchanges: ['TSE'],
      timezone: 'Asia/Tokyo',
      symbolSuffix: '.T',
      tradingHours: {
        open: '09:00',
        close: '15:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    },
    AU: {
      currency: 'AUD',
      exchanges: ['ASX'],
      timezone: 'Australia/Sydney',
      symbolSuffix: '.AX',
      tradingHours: {
        open: '10:00',
        close: '16:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    },
    CA: {
      currency: 'CAD',
      exchanges: ['TSX'],
      timezone: 'America/Toronto',
      symbolSuffix: '.TO',
      tradingHours: {
        open: '09:30',
        close: '16:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    },
    DE: {
      currency: 'EUR',
      exchanges: ['FSE'],
      timezone: 'Europe/Berlin',
      symbolSuffix: '.DE',
      tradingHours: {
        open: '09:00',
        close: '17:30',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    },
    FR: {
      currency: 'EUR',
      exchanges: ['EPA'],
      timezone: 'Europe/Paris',
      symbolSuffix: '.PA',
      tradingHours: {
        open: '09:00',
        close: '17:30',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    }
  }

  // Popular stocks by market
  private readonly popularStocks = {
    US: [
      { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
      { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
      { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services' },
      { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
      { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services' }
    ],
    IN: [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy' },
      { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'Technology' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Financial Services' },
      { symbol: 'INFY', name: 'Infosys Ltd', sector: 'Technology' },
      { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'Consumer Goods' },
      { symbol: 'ITC', name: 'ITC Ltd', sector: 'Consumer Goods' },
      { symbol: 'SBIN', name: 'State Bank of India', sector: 'Financial Services' },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecommunications' },
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Financial Services' },
      { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Industrials' }
    ],
    UK: [
      { symbol: 'VOD', name: 'Vodafone Group Plc', sector: 'Telecommunications' },
      { symbol: 'ULVR', name: 'Unilever Plc', sector: 'Consumer Goods' },
      { symbol: 'AZN', name: 'AstraZeneca Plc', sector: 'Healthcare' },
      { symbol: 'SHEL', name: 'Shell Plc', sector: 'Energy' },
      { symbol: 'BP', name: 'BP Plc', sector: 'Energy' }
    ],
    JP: [
      { symbol: '7203', name: 'Toyota Motor Corporation', sector: 'Automotive' },
      { symbol: '6758', name: 'Sony Group Corporation', sector: 'Technology' },
      { symbol: '9984', name: 'SoftBank Group Corp.', sector: 'Technology' },
      { symbol: '9432', name: 'Nippon Telegraph and Telephone', sector: 'Telecommunications' }
    ]
  }

  // Nifty 50 and Sensex stocks
  private readonly nifty50 = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL',
    'KOTAKBANK', 'LT', 'ASIANPAINT', 'MARUTI', 'AXISBANK', 'NESTLEIND', 'POWERGRID',
    'TITAN', 'ULTRACEMCO', 'WIPRO', 'ONGC', 'NTPC', 'TECHM', 'SUNPHARMA', 'TATAMOTORS',
    'COALINDIA', 'JSWSTEEL', 'BAJFINANCE', 'HCLTECH', 'DRREDDY', 'GRASIM', 'CIPLA',
    'EICHERMOT', 'HEROMOTOCO', 'ADANIPORTS', 'BAJAJFINSV', 'BRITANNIA', 'DIVISLAB',
    'HDFCLIFE', 'ICICIBANK', 'INDUSINDBK', 'M&M', 'SHREECEM', 'TATACONSUM', 'TATASTEEL',
    'UPL', 'APOLLOHOSP', 'BAJAJ-AUTO', 'BPCL', 'HINDALCO', 'SBILIFE', 'TATAPOWER'
  ]

  private readonly sensex = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL',
    'KOTAKBANK', 'LT', 'ASIANPAINT', 'MARUTI', 'AXISBANK', 'NESTLEIND', 'POWERGRID',
    'TITAN', 'ULTRACEMCO', 'WIPRO', 'ONGC', 'NTPC', 'TECHM', 'SUNPHARMA', 'TATAMOTORS',
    'COALINDIA', 'JSWSTEEL', 'BAJFINANCE', 'HCLTECH', 'DRREDDY', 'GRASIM', 'CIPLA'
  ]

  async getStockQuote(symbol: string, market: string = 'US'): Promise<GlobalStockData> {
    const cacheKey = `${symbol}_${market}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      // Try multiple APIs for global coverage
      const data = await this.fetchFromMultipleAPIs(symbol, market)
      this.cache.set(cacheKey, { data, timestamp: Date.now() })
      return data
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error)
      throw new Error(`Failed to fetch data for ${symbol}`)
    }
  }

  private async fetchFromMultipleAPIs(symbol: string, market: string): Promise<GlobalStockData> {
    const marketConfig = this.markets[market as keyof typeof this.markets]
    if (!marketConfig) {
      throw new Error(`Unsupported market: ${market}`)
    }

    // Try different API endpoints based on market
    const apis = this.getAPIsForMarket(market)
    
    for (const api of apis) {
      try {
        const data = await this.fetchFromAPI(api, symbol, market)
        if (data) {
          return this.formatStockData(data, market, symbol)
        }
      } catch (error) {
        console.warn(`API ${api.name} failed for ${symbol}:`, error)
        continue
      }
    }

    throw new Error(`All APIs failed for ${symbol}`)
  }

  private getAPIsForMarket(market: string) {
    const baseAPIs = [
      { name: 'Alpha Vantage', url: '/api/stock/alpha-vantage' },
      { name: 'Yahoo Finance', url: '/api/stock/yahoo' },
      { name: 'IEX Cloud', url: '/api/stock/iex' }
    ]

    // Add market-specific APIs
    switch (market) {
      case 'IN':
        baseAPIs.push(
          { name: 'NSE API', url: '/api/stock/nse' },
          { name: 'BSE API', url: '/api/stock/bse' }
        )
        break
      case 'JP':
        baseAPIs.push(
          { name: 'TSE API', url: '/api/stock/tse' }
        )
        break
      case 'GB':
        baseAPIs.push(
          { name: 'LSE API', url: '/api/stock/lse' }
        )
        break
      case 'AU':
        baseAPIs.push(
          { name: 'ASX API', url: '/api/stock/asx' }
        )
        break
      case 'CA':
        baseAPIs.push(
          { name: 'TSX API', url: '/api/stock/tsx' }
        )
        break
      case 'DE':
        baseAPIs.push(
          { name: 'FSE API', url: '/api/stock/fse' }
        )
        break
      case 'FR':
        baseAPIs.push(
          { name: 'EPA API', url: '/api/stock/epa' }
        )
        break
    }

    return baseAPIs
  }

  private async fetchFromAPI(api: { name: string; url: string }, symbol: string, market: string) {
    const response = await fetch(`${api.url}/${symbol}?market=${market}`)
    if (!response.ok) {
      throw new Error(`API ${api.name} returned ${response.status}`)
    }
    return await response.json()
  }

  private formatStockData(data: any, market: string, symbol: string): GlobalStockData {
    const marketConfig = this.markets[market as keyof typeof this.markets]
    
    return {
      symbol: symbol,
      name: data.name || symbol,
      price: parseFloat(data.price || data.close || 0),
      change: parseFloat(data.change || data.change_amount || 0),
      changePercent: parseFloat(data.changePercent || data.change_percent || 0),
      volume: parseInt(data.volume || 0),
      marketCap: data.marketCap ? parseFloat(data.marketCap) : undefined,
      currency: marketConfig.currency,
      exchange: data.exchange || marketConfig.exchanges[0],
      country: market,
      sector: data.sector,
      industry: data.industry,
      lastUpdated: new Date().toISOString()
    }
  }

  // Get popular stocks by market
  getPopularStocks(market: string = 'US') {
    return this.popularStocks[market as keyof typeof this.popularStocks] || this.popularStocks.US
  }

  // Get Nifty 50 stocks
  getNifty50() {
    return this.nifty50.map(symbol => ({
      symbol,
      name: this.getStockName(symbol),
      sector: this.getStockSector(symbol)
    }))
  }

  // Get Sensex stocks
  getSensex() {
    return this.sensex.map(symbol => ({
      symbol,
      name: this.getStockName(symbol),
      sector: this.getStockSector(symbol)
    }))
  }

  // Get market info with accurate timing
  getMarketInfo(market: string): MarketInfo {
    const config = this.markets[market as keyof typeof this.markets]
    if (!config) {
      throw new Error(`Unsupported market: ${market}`)
    }

    const currentTime = this.getCurrentMarketTime(market)
    const isOpen = this.isMarketOpen(market)
    const marketStatus = this.getMarketStatus(market)

    return {
      country: market,
      currency: config.currency,
      exchange: config.exchanges[0],
      timezone: config.timezone,
      isOpen,
      nextOpen: this.getNextMarketOpen(market),
      nextClose: this.getNextMarketClose(market),
      tradingHours: config.tradingHours,
      currentTime,
      marketStatus
    }
  }

  // Get all supported markets
  getSupportedMarkets() {
    return Object.keys(this.markets).map(market => ({
      code: market,
      name: this.getMarketName(market),
      currency: this.markets[market as keyof typeof this.markets].currency,
      exchanges: this.markets[market as keyof typeof this.markets].exchanges
    }))
  }

  // Search stocks across all markets
  async searchStocks(query: string, limit: number = 20) {
    const results = []
    
    for (const market of Object.keys(this.markets)) {
      try {
        const stocks = await this.searchInMarket(query, market, limit)
        results.push(...stocks)
      } catch (error) {
        console.warn(`Search failed for market ${market}:`, error)
      }
    }

    return results.slice(0, limit)
  }

  private async searchInMarket(query: string, market: string, limit: number) {
    // This would integrate with search APIs
    const popularStocks = this.getPopularStocks(market)
    return popularStocks
      .filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit)
      .map(stock => ({
        ...stock,
        market,
        currency: this.markets[market as keyof typeof this.markets].currency
      }))
  }

  private getStockName(symbol: string): string {
    // This would be populated from a comprehensive database
    const stockNames: { [key: string]: string } = {
      'RELIANCE': 'Reliance Industries Ltd',
      'TCS': 'Tata Consultancy Services Ltd',
      'HDFCBANK': 'HDFC Bank Ltd',
      'INFY': 'Infosys Ltd',
      'HINDUNILVR': 'Hindustan Unilever Ltd',
      'ITC': 'ITC Ltd',
      'SBIN': 'State Bank of India',
      'BHARTIARTL': 'Bharti Airtel Ltd',
      'KOTAKBANK': 'Kotak Mahindra Bank Ltd',
      'LT': 'Larsen & Toubro Ltd'
    }
    return stockNames[symbol] || symbol
  }

  private getStockSector(symbol: string): string {
    const stockSectors: { [key: string]: string } = {
      'RELIANCE': 'Energy',
      'TCS': 'Technology',
      'HDFCBANK': 'Financial Services',
      'INFY': 'Technology',
      'HINDUNILVR': 'Consumer Goods',
      'ITC': 'Consumer Goods',
      'SBIN': 'Financial Services',
      'BHARTIARTL': 'Telecommunications',
      'KOTAKBANK': 'Financial Services',
      'LT': 'Industrials'
    }
    return stockSectors[symbol] || 'Unknown'
  }

  private getMarketName(market: string): string {
    const marketNames: { [key: string]: string } = {
      'US': 'United States',
      'IN': 'India',
      'UK': 'United Kingdom',
      'JP': 'Japan',
      'AU': 'Australia',
      'CA': 'Canada',
      'DE': 'Germany',
      'FR': 'France'
    }
    return marketNames[market] || market
  }

  private getCurrentMarketTime(market: string): string {
    const config = this.markets[market as keyof typeof this.markets]
    if (!config) return ''

    const now = new Date()
    const marketTime = new Date(now.toLocaleString("en-US", { timeZone: config.timezone }))
    return marketTime.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: config.timezone 
    })
  }

  private isMarketOpen(market: string): boolean {
    const config = this.markets[market as keyof typeof this.markets]
    if (!config) return false

    const now = new Date()
    const marketTime = new Date(now.toLocaleString("en-US", { timeZone: config.timezone }))
    const dayOfWeek = marketTime.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Check if it's a trading day (Monday-Friday)
    const isTradingDay = dayOfWeek >= 1 && dayOfWeek <= 5
    
    if (!isTradingDay) return false

    const currentTime = marketTime.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: config.timezone 
    })
    
    const [openHour, openMin] = config.tradingHours.open.split(':').map(Number)
    const [closeHour, closeMin] = config.tradingHours.close.split(':').map(Number)
    
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin
    const currentTimeMinutes = marketTime.getHours() * 60 + marketTime.getMinutes()
    
    return currentTimeMinutes >= openTime && currentTimeMinutes < closeTime
  }

  private getMarketStatus(market: string): 'open' | 'closed' | 'pre-market' | 'after-hours' {
    const config = this.markets[market as keyof typeof this.markets]
    if (!config) return 'closed'

    const now = new Date()
    const marketTime = new Date(now.toLocaleString("en-US", { timeZone: config.timezone }))
    const dayOfWeek = marketTime.getDay()
    
    // Check if it's a trading day
    const isTradingDay = dayOfWeek >= 1 && dayOfWeek <= 5
    
    if (!isTradingDay) return 'closed'

    const [openHour, openMin] = config.tradingHours.open.split(':').map(Number)
    const [closeHour, closeMin] = config.tradingHours.close.split(':').map(Number)
    
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin
    const currentTimeMinutes = marketTime.getHours() * 60 + marketTime.getMinutes()
    
    if (currentTimeMinutes >= openTime && currentTimeMinutes < closeTime) {
      return 'open'
    } else if (currentTimeMinutes < openTime) {
      return 'pre-market'
    } else {
      return 'after-hours'
    }
  }

  private getNextMarketOpen(market: string): string {
    const config = this.markets[market as keyof typeof this.markets]
    if (!config) return ''

    const now = new Date()
    const marketTime = new Date(now.toLocaleString("en-US", { timeZone: config.timezone }))
    const dayOfWeek = marketTime.getDay()
    
    // Find next trading day
    let nextTradingDay = new Date(marketTime)
    if (dayOfWeek === 6) { // Saturday
      nextTradingDay.setDate(marketTime.getDate() + 2) // Monday
    } else if (dayOfWeek === 0) { // Sunday
      nextTradingDay.setDate(marketTime.getDate() + 1) // Monday
    } else if (dayOfWeek === 5) { // Friday
      nextTradingDay.setDate(marketTime.getDate() + 3) // Monday
    } else {
      // Weekday - check if market is closed for the day
      const [openHour, openMin] = config.tradingHours.open.split(':').map(Number)
      const openTime = openHour * 60 + openMin
      const currentTimeMinutes = marketTime.getHours() * 60 + marketTime.getMinutes()
      
      if (currentTimeMinutes >= openTime) {
        // Market already open today, next open is tomorrow
        nextTradingDay.setDate(marketTime.getDate() + 1)
      }
    }
    
    // Set to market open time
    const [openHour, openMin] = config.tradingHours.open.split(':').map(Number)
    nextTradingDay.setHours(openHour, openMin, 0, 0)
    
    return nextTradingDay.toISOString()
  }

  private getNextMarketClose(market: string): string {
    const config = this.markets[market as keyof typeof this.markets]
    if (!config) return ''

    const now = new Date()
    const marketTime = new Date(now.toLocaleString("en-US", { timeZone: config.timezone }))
    const dayOfWeek = marketTime.getDay()
    
    // If it's a weekend, next close is Monday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const nextMonday = new Date(marketTime)
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 2
      nextMonday.setDate(marketTime.getDate() + daysUntilMonday)
      const [closeHour, closeMin] = config.tradingHours.close.split(':').map(Number)
      nextMonday.setHours(closeHour, closeMin, 0, 0)
      return nextMonday.toISOString()
    }
    
    // Set to today's market close time
    const [closeHour, closeMin] = config.tradingHours.close.split(':').map(Number)
    const todayClose = new Date(marketTime)
    todayClose.setHours(closeHour, closeMin, 0, 0)
    
    return todayClose.toISOString()
  }

  // Format currency based on market
  formatCurrency(amount: number, market: string): string {
    const currency = this.markets[market as keyof typeof this.markets]?.currency || 'USD'
    
    const formatters: { [key: string]: Intl.NumberFormat } = {
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      'INR': new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
      'GBP': new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
      'JPY': new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
      'AUD': new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }),
      'CAD': new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
    }

    const formatter = formatters[currency] || formatters['USD']
    return formatter.format(amount)
  }

  // Clear cache
  clearCache() {
    this.cache.clear()
  }
}

export const globalStockService = GlobalStockService.getInstance()
