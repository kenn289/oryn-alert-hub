import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // For NSE, we'll use a free API or mock data
    // In production, you'd use a real NSE API
    const nseData = await fetchNSEStockData(symbol)
    
    if (!nseData) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    return NextResponse.json(nseData)
  } catch (error) {
    console.error('NSE API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function fetchNSEStockData(symbol: string) {
  try {
    // Mock NSE data - in production, use real NSE API
    const mockNSEStocks: { [key: string]: any } = {
      'RELIANCE': {
        symbol: 'RELIANCE',
        name: 'Reliance Industries Ltd',
        price: 2456.75,
        change: 12.50,
        changePercent: 0.51,
        volume: 1250000,
        marketCap: 16600000000000,
        currency: 'INR',
        exchange: 'NSE',
        country: 'IN',
        sector: 'Energy',
        lastUpdated: new Date().toISOString()
      },
      'TCS': {
        symbol: 'TCS',
        name: 'Tata Consultancy Services Ltd',
        price: 3456.80,
        change: -25.30,
        changePercent: -0.73,
        volume: 850000,
        marketCap: 12500000000000,
        currency: 'INR',
        exchange: 'NSE',
        country: 'IN',
        sector: 'Technology',
        lastUpdated: new Date().toISOString()
      },
      'INFY': {
        symbol: 'INFY',
        name: 'Infosys Ltd',
        price: 1523.45,
        change: 8.75,
        changePercent: 0.58,
        volume: 2100000,
        marketCap: 6400000000000,
        currency: 'INR',
        exchange: 'NSE',
        country: 'IN',
        sector: 'Technology',
        lastUpdated: new Date().toISOString()
      },
      'HDFCBANK': {
        symbol: 'HDFCBANK',
        name: 'HDFC Bank Ltd',
        price: 1689.20,
        change: 15.80,
        changePercent: 0.94,
        volume: 1800000,
        marketCap: 12800000000000,
        currency: 'INR',
        exchange: 'NSE',
        country: 'IN',
        sector: 'Financial Services',
        lastUpdated: new Date().toISOString()
      },
      'ICICIBANK': {
        symbol: 'ICICIBANK',
        name: 'ICICI Bank Ltd',
        price: 987.65,
        change: -5.25,
        changePercent: -0.53,
        volume: 2200000,
        marketCap: 6800000000000,
        currency: 'INR',
        exchange: 'NSE',
        country: 'IN',
        sector: 'Financial Services',
        lastUpdated: new Date().toISOString()
      }
    }

    return mockNSEStocks[symbol.toUpperCase()]
  } catch (error) {
    console.error('Error fetching NSE data:', error)
    return null
  }
}

