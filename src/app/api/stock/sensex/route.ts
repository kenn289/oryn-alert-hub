import { NextRequest, NextResponse } from 'next/server'
import { globalStockService } from '../../../../lib/global-stock-service'

export async function GET(request: NextRequest) {
  try {
    const sensex = globalStockService.getSensex()
    
    return NextResponse.json({
      index: 'SENSEX',
      market: 'IN',
      currency: 'INR',
      stocks: sensex,
      total: sensex.length,
      description: 'SENSEX is a stock market index of 30 well-established and financially sound companies listed on Bombay Stock Exchange.'
    })
  } catch (error) {
    console.error('Error fetching Sensex stocks:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch Sensex stocks' },
      { status: 500 }
    )
  }
}
