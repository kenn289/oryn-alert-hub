import { NextRequest, NextResponse } from 'next/server'
import { stockDataService } from '../../../../lib/stock-data-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const symbolUpper = symbol.toUpperCase()
  
  try {
    
    // Validate symbol format
    if (!symbolUpper || symbolUpper.length < 1 || symbolUpper.length > 10) {
      return NextResponse.json(
        { error: 'Invalid stock symbol' },
        { status: 400 }
      )
    }

    // Using Yahoo Finance as primary source, Alpha Vantage as fallback

    // Fetch REAL-TIME stock data - Yahoo Finance first, then Alpha Vantage fallback
    const stockData = await stockDataService.getStockQuote(symbolUpper)

    // Return standardized stock data
    return NextResponse.json({
      symbol: stockData.symbol,
      name: stockData.name,
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
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error)
    
    // Check if it's a symbol not found error
    if (error instanceof Error && error.message.includes('not found or not supported')) {
      return NextResponse.json(
        { 
          error: 'Stock Symbol Not Found',
          message: error.message,
          suggestions: [
            'Check if the symbol is correct (e.g., AAPL, GOOGL, MSFT, TSLA, AMZN)',
            'Try without periods or special characters',
            'Ensure the stock is publicly traded',
            'Check if markets are open',
            'Popular symbols: AAPL, GOOGL, MSFT, TSLA, AMZN, META, NVDA, NFLX'
          ]
        },
        { status: 404 }
      )
    }
    
    // Check if it's an API key error
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { 
          error: 'API Configuration Error',
          message: error.message,
          setupRequired: true
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch stock data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
