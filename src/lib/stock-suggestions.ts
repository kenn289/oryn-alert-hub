// Stock suggestions service
export interface StockSuggestion {
  symbol: string
  name: string
  sector: string
  market?: string
  currency?: string
  price?: number
  change?: number
  changePercent?: number
  avgPrice?: number
}

// Popular stocks database - Global stocks
const POPULAR_STOCKS: StockSuggestion[] = [
  // US Technology
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'GOOG', name: 'Alphabet Inc. Class C', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', sector: 'Technology', market: 'US', currency: 'USD' },
  { symbol: 'IBM', name: 'International Business Machines Corporation', sector: 'Technology', market: 'US', currency: 'USD' },
  
  // US Financial
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial', market: 'US', currency: 'USD' },
  { symbol: 'BAC', name: 'Bank of America Corporation', sector: 'Financial', market: 'US', currency: 'USD' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', sector: 'Financial', market: 'US', currency: 'USD' },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.', sector: 'Financial', market: 'US', currency: 'USD' },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Financial', market: 'US', currency: 'USD' },
  { symbol: 'C', name: 'Citigroup Inc.', sector: 'Financial', market: 'US', currency: 'USD' },
  { symbol: 'AXP', name: 'American Express Company', sector: 'Financial', market: 'US', currency: 'USD' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financial', market: 'US', currency: 'USD' },
  { symbol: 'MA', name: 'Mastercard Incorporated', sector: 'Financial', market: 'US', currency: 'USD' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'Financial', market: 'US', currency: 'USD' },
  
  // Indian Technology (NSE)
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'Technology', market: 'IN', currency: 'INR' },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'Technology', market: 'IN', currency: 'INR' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'Technology', market: 'IN', currency: 'INR' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'Technology', market: 'IN', currency: 'INR' },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'Technology', market: 'IN', currency: 'INR' },
  
  // Indian Banking (NSE)
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Financial', market: 'IN', currency: 'INR' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Financial', market: 'IN', currency: 'INR' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Financial', market: 'IN', currency: 'INR' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Financial', market: 'IN', currency: 'INR' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Financial', market: 'IN', currency: 'INR' },
  
  // Indian Energy (NSE)
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy', market: 'IN', currency: 'INR' },
  { symbol: 'ONGC', name: 'Oil and Natural Gas Corporation Ltd', sector: 'Energy', market: 'IN', currency: 'INR' },
  { symbol: 'IOC', name: 'Indian Oil Corporation Ltd', sector: 'Energy', market: 'IN', currency: 'INR' },
  
  // Japanese Technology (TSE)
  { symbol: '7203', name: 'Toyota Motor Corporation', sector: 'Automotive', market: 'JP', currency: 'JPY' },
  { symbol: '6758', name: 'Sony Group Corporation', sector: 'Technology', market: 'JP', currency: 'JPY' },
  { symbol: '9984', name: 'SoftBank Group Corp', sector: 'Technology', market: 'JP', currency: 'JPY' },
  
  // UK Stocks (LSE)
  { symbol: 'TSCO', name: 'Tesco PLC', sector: 'Retail', market: 'GB', currency: 'GBP' },
  { symbol: 'VOD', name: 'Vodafone Group PLC', sector: 'Telecommunications', market: 'GB', currency: 'GBP' },
  { symbol: 'BP', name: 'BP PLC', sector: 'Energy', market: 'GB', currency: 'GBP' },
]

export class StockSuggestionsService {
  static getSuggestions(query: string, limit: number = 10): StockSuggestion[] {
    if (!query || query.length < 1) {
      return POPULAR_STOCKS.slice(0, limit)
    }

    const normalizedQuery = query.toUpperCase().trim()
    
    // Filter stocks that match the query
    const matches = POPULAR_STOCKS.filter(stock => 
      stock.symbol.includes(normalizedQuery) || 
      stock.name.toUpperCase().includes(normalizedQuery)
    )

    // Sort by relevance (exact symbol matches first, then name matches)
    const sortedMatches = matches.sort((a, b) => {
      const aSymbolMatch = a.symbol === normalizedQuery
      const bSymbolMatch = b.symbol === normalizedQuery
      
      if (aSymbolMatch && !bSymbolMatch) return -1
      if (!aSymbolMatch && bSymbolMatch) return 1
      
      const aStartsWith = a.symbol.startsWith(normalizedQuery)
      const bStartsWith = b.symbol.startsWith(normalizedQuery)
      
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      
      return a.symbol.localeCompare(b.symbol)
    })

    return sortedMatches.slice(0, limit)
  }

  static async getGlobalSuggestions(query: string, limit: number = 10): Promise<StockSuggestion[]> {
    if (!query || query.length < 1) {
      return POPULAR_STOCKS.slice(0, limit)
    }

    try {
      // Use global search API
      const response = await fetch(`/api/stock/global-search?q=${encodeURIComponent(query)}&limit=${limit}`)
      if (!response.ok) {
        console.warn('Global search failed, falling back to local suggestions')
        return this.getSuggestions(query, limit)
      }

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.warn('Global search error, falling back to local suggestions:', error)
      return this.getSuggestions(query, limit)
    }
  }

  static getPopularStocks(limit: number = 20): StockSuggestion[] {
    return POPULAR_STOCKS.slice(0, limit)
  }

  static getStocksBySector(sector: string, limit: number = 10): StockSuggestion[] {
    return POPULAR_STOCKS
      .filter(stock => stock.sector === sector)
      .slice(0, limit)
  }

  static getStocksByMarket(market: string, limit: number = 10): StockSuggestion[] {
    return POPULAR_STOCKS
      .filter(stock => stock.market === market)
      .slice(0, limit)
  }

  static getAllSectors(): string[] {
    const sectors = new Set(POPULAR_STOCKS.map(stock => stock.sector))
    return Array.from(sectors).sort()
  }

  static getAllMarkets(): string[] {
    const markets = new Set(POPULAR_STOCKS.map(stock => stock.market).filter(Boolean))
    return Array.from(markets).sort()
  }

  static async getStockWithPrice(symbol: string, market?: string): Promise<StockSuggestion | null> {
    try {
      // Fetch real-time data from our global API
      const marketParam = market ? `&market=${market}` : ''
      const response = await fetch(`/api/stock/global/${symbol}?${marketParam}`)
      if (!response.ok) {
        console.error(`Failed to fetch real-time data for ${symbol}`)
        return null
      }

      const stockData = await response.json()
      const stock = POPULAR_STOCKS.find(s => s.symbol === symbol)
      
      if (!stock) return null

      return {
        ...stock,
        price: stockData.price,
        avgPrice: stockData.price, // Use current price as average
        change: stockData.change,
        changePercent: stockData.changePercent
      }
    } catch (error) {
      console.error('Error fetching real-time stock price:', error)
      return null
    }
  }
}