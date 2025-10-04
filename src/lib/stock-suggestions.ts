// Stock suggestions service
export interface StockSuggestion {
  symbol: string
  name: string
  sector: string
  price?: number
  change?: number
  changePercent?: number
  avgPrice?: number
}

// Popular stocks database
const POPULAR_STOCKS: StockSuggestion[] = [
  // Technology
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', sector: 'Technology' },
  { symbol: 'GOOG', name: 'Alphabet Inc. Class C', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Technology' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Technology' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' },
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Technology' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', sector: 'Technology' },
  { symbol: 'IBM', name: 'International Business Machines Corporation', sector: 'Technology' },
  
  // Financial
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial' },
  { symbol: 'BAC', name: 'Bank of America Corporation', sector: 'Financial' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', sector: 'Financial' },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.', sector: 'Financial' },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Financial' },
  { symbol: 'C', name: 'Citigroup Inc.', sector: 'Financial' },
  { symbol: 'AXP', name: 'American Express Company', sector: 'Financial' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financial' },
  { symbol: 'MA', name: 'Mastercard Incorporated', sector: 'Financial' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'Financial' },
  
  // Healthcare
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
  { symbol: 'UNH', name: 'UnitedHealth Group Incorporated', sector: 'Healthcare' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', sector: 'Healthcare' },
  { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare' },
  { symbol: 'DHR', name: 'Danaher Corporation', sector: 'Healthcare' },
  { symbol: 'BMY', name: 'Bristol Myers Squibb Company', sector: 'Healthcare' },
  { symbol: 'AMGN', name: 'Amgen Inc.', sector: 'Healthcare' },
  
  // Consumer
  { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer' },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer' },
  { symbol: 'PG', name: 'The Procter & Gamble Company', sector: 'Consumer' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Consumer' },
  { symbol: 'MCD', name: 'McDonald\'s Corporation', sector: 'Consumer' },
  { symbol: 'SBUX', name: 'Starbucks Corporation', sector: 'Consumer' },
  { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer' },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Consumer' },
  { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Consumer' },
  
  // Energy
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy' },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy' },
  { symbol: 'EOG', name: 'EOG Resources Inc.', sector: 'Energy' },
  { symbol: 'SLB', name: 'Schlumberger Limited', sector: 'Energy' },
  { symbol: 'KMI', name: 'Kinder Morgan Inc.', sector: 'Energy' },
  { symbol: 'PSX', name: 'Phillips 66', sector: 'Energy' },
  { symbol: 'VLO', name: 'Valero Energy Corporation', sector: 'Energy' },
  
  // Industrial
  { symbol: 'BA', name: 'The Boeing Company', sector: 'Industrial' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrial' },
  { symbol: 'GE', name: 'General Electric Company', sector: 'Industrial' },
  { symbol: 'HON', name: 'Honeywell International Inc.', sector: 'Industrial' },
  { symbol: 'MMM', name: '3M Company', sector: 'Industrial' },
  { symbol: 'UPS', name: 'United Parcel Service Inc.', sector: 'Industrial' },
  { symbol: 'FDX', name: 'FedEx Corporation', sector: 'Industrial' },
  { symbol: 'LMT', name: 'Lockheed Martin Corporation', sector: 'Industrial' },
  
  // Utilities
  { symbol: 'NEE', name: 'NextEra Energy Inc.', sector: 'Utilities' },
  { symbol: 'DUK', name: 'Duke Energy Corporation', sector: 'Utilities' },
  { symbol: 'SO', name: 'The Southern Company', sector: 'Utilities' },
  { symbol: 'D', name: 'Dominion Energy Inc.', sector: 'Utilities' },
  { symbol: 'EXC', name: 'Exelon Corporation', sector: 'Utilities' },
  { symbol: 'AEP', name: 'American Electric Power Company Inc.', sector: 'Utilities' },
  
  // Materials
  { symbol: 'LIN', name: 'Linde plc', sector: 'Materials' },
  { symbol: 'APD', name: 'Air Products and Chemicals Inc.', sector: 'Materials' },
  { symbol: 'SHW', name: 'The Sherwin-Williams Company', sector: 'Materials' },
  { symbol: 'ECL', name: 'Ecolab Inc.', sector: 'Materials' },
  { symbol: 'DD', name: 'DuPont de Nemours Inc.', sector: 'Materials' },
  { symbol: 'DOW', name: 'Dow Inc.', sector: 'Materials' },
  
  // Real Estate
  { symbol: 'AMT', name: 'American Tower Corporation', sector: 'Real Estate' },
  { symbol: 'PLD', name: 'Prologis Inc.', sector: 'Real Estate' },
  { symbol: 'CCI', name: 'Crown Castle Inc.', sector: 'Real Estate' },
  { symbol: 'EQIX', name: 'Equinix Inc.', sector: 'Real Estate' },
  { symbol: 'PSA', name: 'Public Storage', sector: 'Real Estate' },
  
  // Communication
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Communication' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', sector: 'Communication' },
  { symbol: 'TMUS', name: 'T-Mobile US Inc.', sector: 'Communication' },
  { symbol: 'CHTR', name: 'Charter Communications Inc.', sector: 'Communication' },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Communication' },
  
  // ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', sector: 'ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', sector: 'ETF' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', sector: 'ETF' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', sector: 'ETF' },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', sector: 'ETF' },
  { symbol: 'XLF', name: 'Financial Select Sector SPDR Fund', sector: 'ETF' },
  { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', sector: 'ETF' },
  { symbol: 'XLE', name: 'Energy Select Sector SPDR Fund', sector: 'ETF' },
  { symbol: 'XLV', name: 'Health Care Select Sector SPDR Fund', sector: 'ETF' }
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

  static getPopularStocks(limit: number = 20): StockSuggestion[] {
    return POPULAR_STOCKS.slice(0, limit)
  }

  static getStocksBySector(sector: string, limit: number = 10): StockSuggestion[] {
    return POPULAR_STOCKS
      .filter(stock => stock.sector === sector)
      .slice(0, limit)
  }

  static getAllSectors(): string[] {
    const sectors = new Set(POPULAR_STOCKS.map(stock => stock.sector))
    return Array.from(sectors).sort()
  }

  static async getStockWithPrice(symbol: string): Promise<StockSuggestion | null> {
    try {
      // Fetch real-time data from our API
      const response = await fetch(`/api/stock/multi/${symbol}`)
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
