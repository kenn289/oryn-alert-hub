import { NextRequest, NextResponse } from 'next/server'
import { multiApiStockService } from '@/lib/multi-api-stock-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const { searchParams } = new URL(request.url)
  const providedMarket = (searchParams.get('market') || undefined) as string | undefined
  
  // Normalize symbol and infer market from suffix when possible
  const upperSymbol = (symbol || '').toUpperCase().trim()
  const suffixToMarket: Record<string, string> = {
    '.NS': 'IN',
    '.BO': 'IN',
    '.L': 'GB',
    '.T': 'JP',
    '.AX': 'AU',
    '.TO': 'CA',
    '.DE': 'DE',
    '.PA': 'FR'
  }
  const inferMarketFromSymbol = (s: string): string | undefined => {
    const dotIndex = s.lastIndexOf('.')
    if (dotIndex > 0) {
      const suffix = s.substring(dotIndex)
      return suffixToMarket[suffix]
    }
    // Numeric-only symbols are commonly BSE codes
    if (/^\d+$/.test(s)) return 'IN'
    return undefined
  }
  const inferredMarket = inferMarketFromSymbol(upperSymbol)
  // Prefer inferred market from suffix to avoid wrong routing (e.g., TCS.NS)
  const market = (inferredMarket || (providedMarket ? providedMarket.toUpperCase().trim() : undefined)) || 'US'
  
  try {
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      )
    }

    // Prefer unified multi-API (Yahoo primary) for ALL markets for consistency
    try {
      const quote = await multiApiStockService.getStockQuote(upperSymbol, market)
      return NextResponse.json({
        symbol: quote.symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        avgVolume: quote.avgVolume,
        high: quote.high,
        low: quote.low,
        open: quote.open,
        previousClose: quote.previousClose,
        marketCap: quote.marketCap,
        pe: quote.pe,
        currency: quote.currency || (market === 'US' ? 'USD' : undefined),
        exchange: quote.exchange || market,
        source: quote.source,
        lastUpdated: new Date().toISOString()
      })
    } catch (primaryError) {
      // Fallbacks for specific markets (keeps legacy behavior but with better normalization)
      let stockData: any | undefined
      if (market === 'IN') {
        // Normalize to base symbol for NSE/BSE mock APIs
        const baseSymbol = upperSymbol.includes('.') ? upperSymbol.split('.')[0] : upperSymbol
        try {
          const nseResponse = await fetch(`${request.nextUrl.origin}/api/stock/nse?symbol=${baseSymbol}`)
          if (nseResponse.ok) {
            stockData = await nseResponse.json()
          }
        } catch (e) {
          console.warn('NSE API failed, trying BSE')
        }
        if (!stockData) {
          try {
            const bseSymbol = /^\d+$/.test(baseSymbol) ? baseSymbol : baseSymbol
            const bseResponse = await fetch(`${request.nextUrl.origin}/api/stock/bse?symbol=${bseSymbol}`)
            if (bseResponse.ok) {
              stockData = await bseResponse.json()
            }
          } catch (e) {
            console.warn('BSE API failed')
          }
        }
      } else if (market === 'JP') {
        try {
          const tseResponse = await fetch(`${request.nextUrl.origin}/api/stock/tse?symbol=${upperSymbol}`)
          if (tseResponse.ok) {
            stockData = await tseResponse.json()
          }
        } catch (e) {
          console.warn('TSE API failed')
        }
      } else if (market === 'GB') {
        try {
          const lseResponse = await fetch(`${request.nextUrl.origin}/api/stock/lse?symbol=${upperSymbol}`)
          if (lseResponse.ok) {
            stockData = await lseResponse.json()
          }
        } catch (e) {
          console.warn('LSE API failed')
        }
      }

      if (stockData) {
        // Normalize fallback to the same shape as unified response
        return NextResponse.json({
          symbol: stockData.symbol || upperSymbol,
          name: stockData.name || upperSymbol,
          price: stockData.price,
          change: stockData.change,
          changePercent: stockData.changePercent,
          volume: stockData.volume,
          avgVolume: stockData.avgVolume,
          high: stockData.high,
          low: stockData.low,
          open: stockData.open,
          previousClose: stockData.previousClose,
          marketCap: stockData.marketCap,
          pe: stockData.pe,
          currency: stockData.currency || (market === 'US' ? 'USD' : undefined),
          exchange: stockData.exchange || market,
          source: stockData.source || 'fallback',
          lastUpdated: new Date().toISOString()
        })
      }

      // Last resort: explicit error to avoid random inconsistent prices
      return NextResponse.json(
        { error: 'Stock not found or data unavailable', symbol: upperSymbol, market },
        { status: 404 }
      )
    }
    
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
