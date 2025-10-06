import { NextRequest, NextResponse } from 'next/server'
import { globalStockService } from '../../../../lib/global-stock-service'

export async function GET(request: NextRequest) {
  try {
    const nifty50 = globalStockService.getNifty50()
    
    return NextResponse.json({
      index: 'NIFTY 50',
      market: 'IN',
      currency: 'INR',
      stocks: nifty50,
      total: nifty50.length,
      description: 'Nifty 50 is a benchmark Indian stock market index representing 50 of the largest companies listed on the National Stock Exchange of India.'
    })
  } catch (error) {
    console.error('Error fetching Nifty 50 stocks:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch Nifty 50 stocks' },
      { status: 500 }
    )
  }
}
