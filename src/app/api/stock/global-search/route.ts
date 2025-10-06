import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const market = searchParams.get('market')
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Search across all markets
    const results = await searchGlobalStocks(query, market)
    
    return NextResponse.json({
      query,
      market: market || 'all',
      results,
      total: results.length
    })
  } catch (error) {
    console.error('Global stock search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function searchGlobalStocks(query: string, market?: string) {
  const results: any[] = []
  
  // Define markets to search
  const marketsToSearch = market ? [market] : ['US', 'IN', 'JP', 'GB', 'AU', 'CA', 'DE', 'FR']
  
  for (const marketCode of marketsToSearch) {
    try {
      const marketResults = await searchInMarket(query, marketCode)
      results.push(...marketResults)
    } catch (error) {
      console.warn(`Search failed for market ${marketCode}:`, error)
    }
  }
  
  return results
}

async function searchInMarket(query: string, market: string) {
  // Normalize common aliases
  if (market === 'UK') market = 'GB'
  const results: any[] = []
  
  switch (market) {
    case 'IN':
      // Search NSE and BSE
      results.push(...await searchNSE(query))
      results.push(...await searchBSE(query))
      break
    case 'JP':
      results.push(...await searchTSE(query))
      break
    case 'GB':
      results.push(...await searchLSE(query))
      break
    case 'US':
      results.push(...await searchUS(query))
      break
    default:
      // For other markets, use generic search
      results.push(...await searchGeneric(query, market))
  }
  
  return results
}

async function searchNSE(query: string) {
  // Mock NSE search results
  const nseStocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE', market: 'IN', currency: 'INR' },
    { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', exchange: 'NSE', market: 'IN', currency: 'INR' },
    { symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', market: 'IN', currency: 'INR' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE', market: 'IN', currency: 'INR' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', exchange: 'NSE', market: 'IN', currency: 'INR' }
  ]

  const filtered = nseStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
    stock.name.toLowerCase().includes(query.toLowerCase())
  )
  return filtered.map(withSuffix)
}

async function searchBSE(query: string) {
  // Mock BSE search results
  const bseStocks = [
    { symbol: '500325', name: 'Reliance Industries Ltd', exchange: 'BSE', market: 'IN', currency: 'INR' },
    { symbol: '532540', name: 'Tata Consultancy Services Ltd', exchange: 'BSE', market: 'IN', currency: 'INR' },
    { symbol: '500209', name: 'Infosys Ltd', exchange: 'BSE', market: 'IN', currency: 'INR' },
    { symbol: '500180', name: 'HDFC Bank Ltd', exchange: 'BSE', market: 'IN', currency: 'INR' },
    { symbol: '532174', name: 'ICICI Bank Ltd', exchange: 'BSE', market: 'IN', currency: 'INR' }
  ]

  const filtered = bseStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
    stock.name.toLowerCase().includes(query.toLowerCase())
  )
  return filtered.map(withSuffix)
}

async function searchTSE(query: string) {
  // Mock TSE search results
  const tseStocks = [
    { symbol: '7203', name: 'Toyota Motor Corporation', exchange: 'TSE', market: 'JP', currency: 'JPY' },
    { symbol: '6758', name: 'Sony Group Corporation', exchange: 'TSE', market: 'JP', currency: 'JPY' },
    { symbol: '9984', name: 'SoftBank Group Corp', exchange: 'TSE', market: 'JP', currency: 'JPY' }
  ]

  const filtered = tseStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
    stock.name.toLowerCase().includes(query.toLowerCase())
  )
  return filtered.map(withSuffix)
}

async function searchLSE(query: string) {
  // Mock LSE search results
  const lseStocks = [
    { symbol: 'TSCO', name: 'Tesco PLC', exchange: 'LSE', market: 'GB', currency: 'GBP' },
    { symbol: 'VOD', name: 'Vodafone Group PLC', exchange: 'LSE', market: 'GB', currency: 'GBP' },
    { symbol: 'BP', name: 'BP PLC', exchange: 'LSE', market: 'GB', currency: 'GBP' }
  ]

  const filtered = lseStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
    stock.name.toLowerCase().includes(query.toLowerCase())
  )
  return filtered.map(withSuffix)
}

async function searchUS(query: string) {
  // Mock US search results
  const usStocks = [
    { symbol: 'AAPL', name: 'Apple Inc', exchange: 'NASDAQ', market: 'US', currency: 'USD' },
    { symbol: 'GOOGL', name: 'Alphabet Inc', exchange: 'NASDAQ', market: 'US', currency: 'USD' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', market: 'US', currency: 'USD' },
    { symbol: 'TSLA', name: 'Tesla Inc', exchange: 'NASDAQ', market: 'US', currency: 'USD' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', market: 'US', currency: 'USD' }
  ]

  const filtered = usStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
    stock.name.toLowerCase().includes(query.toLowerCase())
  )
  return filtered.map(withSuffix)
}

async function searchGeneric(query: string, market: string) {
  // Generic search for other markets
  return []
}

function withSuffix(stock: { symbol: string; market: string; exchange?: string; name: string; currency: string }) {
  const { symbol, market, exchange } = stock
  if (symbol.includes('.')) return stock

  const suffixMap: Record<string, string> = {
    US: '',
    IN: exchange === 'BSE' ? '.BO' : '.NS',
    GB: '.L',
    JP: '.T',
    AU: '.AX',
    CA: '.TO',
    DE: '.DE',
    FR: '.PA'
  }

  const suffix = suffixMap[market] ?? ''
  return {
    ...stock,
    symbol: `${symbol}${suffix}`
  }
}
