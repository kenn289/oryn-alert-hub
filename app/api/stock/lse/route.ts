import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // For LSE (London Stock Exchange), we'll use mock data
    // In production, you'd use a real LSE API
    const lseData = await fetchLSEStockData(symbol)
    
    if (!lseData) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    return NextResponse.json(lseData)
  } catch (error) {
    console.error('LSE API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function fetchLSEStockData(symbol: string) {
  try {
    // Mock LSE data - in production, use real LSE API
    const mockLSEStocks: { [key: string]: any } = {
      'TSCO': { // Tesco
        symbol: 'TSCO',
        name: 'Tesco PLC',
        price: 245.75,
        change: 1.50,
        changePercent: 0.61,
        volume: 1250000,
        marketCap: 16600000000,
        currency: 'GBP',
        exchange: 'LSE',
        country: 'GB',
        sector: 'Retail',
        lastUpdated: new Date().toISOString()
      },
      'VOD': { // Vodafone
        symbol: 'VOD',
        name: 'Vodafone Group PLC',
        price: 89.80,
        change: -2.30,
        changePercent: -2.50,
        volume: 850000,
        marketCap: 25000000000,
        currency: 'GBP',
        exchange: 'LSE',
        country: 'GB',
        sector: 'Telecommunications',
        lastUpdated: new Date().toISOString()
      },
      'BP': { // BP
        symbol: 'BP',
        name: 'BP PLC',
        price: 456.45,
        change: 3.75,
        changePercent: 0.83,
        volume: 2100000,
        marketCap: 64000000000,
        currency: 'GBP',
        exchange: 'LSE',
        country: 'GB',
        sector: 'Energy',
        lastUpdated: new Date().toISOString()
      }
    }

    return mockLSEStocks[symbol.toUpperCase()]
  } catch (error) {
    console.error('Error fetching LSE data:', error)
    return null
  }
}

