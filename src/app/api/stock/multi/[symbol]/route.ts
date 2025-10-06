import { NextRequest, NextResponse } from 'next/server'
import { multiApiStockService } from '@/lib/multi-api-stock-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const { searchParams } = new URL(request.url)
  const market = (searchParams.get('market') || undefined) as string | undefined
  
  try {
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      )
    }

    const quote = await multiApiStockService.getStockQuote(symbol, market)
    
    // Ensure extremely high precision for price fields
    const precise = {
      ...quote,
      price: Number(quote.price.toPrecision(12)),
      change: Number(quote.change.toPrecision(12)),
      changePercent: Number(quote.changePercent.toPrecision(12))
    }

    return NextResponse.json(precise)
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
