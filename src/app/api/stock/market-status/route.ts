import { NextRequest, NextResponse } from 'next/server'
import { globalStockService } from '../../../../lib/global-stock-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const market = searchParams.get('market')
    
    if (market) {
      // Get specific market status
      const marketInfo = globalStockService.getMarketInfo(market)
      return NextResponse.json(marketInfo)
    } else {
      // Get all markets status
      const markets = ['US', 'IN', 'UK', 'JP', 'AU', 'CA', 'DE', 'FR']
      const allMarkets = markets.map(market => globalStockService.getMarketInfo(market))
      
      return NextResponse.json({
        markets: allMarkets,
        total: allMarkets.length,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Error fetching market status:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch market status' },
      { status: 500 }
    )
  }
}
