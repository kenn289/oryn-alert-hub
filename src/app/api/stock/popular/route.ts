import { NextRequest, NextResponse } from 'next/server'
import { globalStockService } from '@/lib/global-stock-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const market = searchParams.get('market') || 'US'
    
    const stocks = globalStockService.getPopularStocks(market)
    
    return NextResponse.json({
      market,
      stocks,
      total: stocks.length
    })
  } catch (error) {
    console.error('Error fetching popular stocks:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch popular stocks' },
      { status: 500 }
    )
  }
}
