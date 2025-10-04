import { NextRequest, NextResponse } from 'next/server'
import { globalStockService } from '@/lib/global-stock-service'

export async function GET(request: NextRequest) {
  try {
    const markets = globalStockService.getSupportedMarkets()
    
    return NextResponse.json({
      markets,
      total: markets.length
    })
  } catch (error) {
    console.error('Error fetching supported markets:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch supported markets' },
      { status: 500 }
    )
  }
}
