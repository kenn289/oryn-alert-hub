import { NextRequest, NextResponse } from 'next/server'
import { multiApiStockService } from '@/lib/multi-api-stock-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  
  try {
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      )
    }

    const quote = await multiApiStockService.getStockQuote(symbol)
    
    return NextResponse.json(quote)
  } catch (error) {
    console.error(`Error fetching multi-API quote for ${symbol}:`, error)
    
    if (error instanceof Error) {
      if (error.message.includes('All stock data APIs failed')) {
        return NextResponse.json(
          { 
            error: 'All stock data APIs are currently unavailable',
            message: 'Please try again later or check your API keys',
            symbol: symbol
          },
          { status: 503 }
        )
      }
      
        return NextResponse.json(
          { 
            error: error.message,
            symbol: symbol
          },
          { status: 500 }
        )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        symbol: symbol
      },
      { status: 500 }
    )
  }
}
