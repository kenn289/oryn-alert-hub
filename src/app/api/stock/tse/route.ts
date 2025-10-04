import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // For TSE (Tokyo Stock Exchange), we'll use mock data
    // In production, you'd use a real TSE API
    const tseData = await fetchTSEStockData(symbol)
    
    if (!tseData) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    return NextResponse.json(tseData)
  } catch (error) {
    console.error('TSE API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function fetchTSEStockData(symbol: string) {
  try {
    // Mock TSE data - in production, use real TSE API
    const mockTSEStocks: { [key: string]: any } = {
      '7203': { // Toyota
        symbol: '7203',
        name: 'Toyota Motor Corporation',
        price: 2456.75,
        change: 12.50,
        changePercent: 0.51,
        volume: 1250000,
        marketCap: 16600000000000,
        currency: 'JPY',
        exchange: 'TSE',
        country: 'JP',
        sector: 'Automotive',
        lastUpdated: new Date().toISOString()
      },
      '6758': { // Sony
        symbol: '6758',
        name: 'Sony Group Corporation',
        price: 12345.80,
        change: -25.30,
        changePercent: -0.73,
        volume: 850000,
        marketCap: 12500000000000,
        currency: 'JPY',
        exchange: 'TSE',
        country: 'JP',
        sector: 'Technology',
        lastUpdated: new Date().toISOString()
      },
      '9984': { // SoftBank
        symbol: '9984',
        name: 'SoftBank Group Corp',
        price: 5678.45,
        change: 8.75,
        changePercent: 0.58,
        volume: 2100000,
        marketCap: 6400000000000,
        currency: 'JPY',
        exchange: 'TSE',
        country: 'JP',
        sector: 'Technology',
        lastUpdated: new Date().toISOString()
      }
    }

    return mockTSEStocks[symbol]
  } catch (error) {
    console.error('Error fetching TSE data:', error)
    return null
  }
}
