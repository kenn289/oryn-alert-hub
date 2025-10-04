import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const { searchParams } = new URL(request.url)
  const market = searchParams.get('market') || 'US'
  
  try {
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      )
    }

    // Route to market-specific APIs
    let stockData
    switch (market) {
      case 'IN':
        // Try NSE first, then BSE
        try {
          const nseResponse = await fetch(`${request.nextUrl.origin}/api/stock/nse?symbol=${symbol}`)
          if (nseResponse.ok) {
            stockData = await nseResponse.json()
            break
          }
        } catch (e) {
          console.warn('NSE API failed, trying BSE')
        }
        
        try {
          const bseResponse = await fetch(`${request.nextUrl.origin}/api/stock/bse?symbol=${symbol}`)
          if (bseResponse.ok) {
            stockData = await bseResponse.json()
            break
          }
        } catch (e) {
          console.warn('BSE API failed')
        }
        break
        
      case 'JP':
        try {
          const tseResponse = await fetch(`${request.nextUrl.origin}/api/stock/tse?symbol=${symbol}`)
          if (tseResponse.ok) {
            stockData = await tseResponse.json()
            break
          }
        } catch (e) {
          console.warn('TSE API failed')
        }
        break
        
      case 'GB':
        try {
          const lseResponse = await fetch(`${request.nextUrl.origin}/api/stock/lse?symbol=${symbol}`)
          if (lseResponse.ok) {
            stockData = await lseResponse.json()
            break
          }
        } catch (e) {
          console.warn('LSE API failed')
        }
        break
        
      default:
        // For US and other markets, return mock data
        stockData = {
          symbol: symbol,
          name: `${symbol} Inc.`,
          price: Math.random() * 200 + 50,
          change: (Math.random() - 0.5) * 10,
          changePercent: (Math.random() - 0.5) * 5,
          volume: Math.floor(Math.random() * 1000000),
          currency: market === 'US' ? 'USD' : 'USD',
          exchange: market === 'US' ? 'NASDAQ' : 'Unknown',
          country: market,
          lastUpdated: new Date().toISOString()
        }
    }
    
    if (!stockData) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(stockData)
  } catch (error) {
    console.error(`Error fetching global stock data for ${symbol}:`, error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: error.message,
          symbol: symbol,
          market: market
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        symbol: symbol,
        market: market
      },
      { status: 500 }
    )
  }
}
