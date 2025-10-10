import { NextRequest, NextResponse } from 'next/server'
import { globalMarketOverviewService } from '@/lib/global-market-overview-service'

// GET /api/market/global-overview - Get comprehensive global market overview
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const market = searchParams.get('market')
    const action = searchParams.get('action')

    if (action === 'cache-stats') {
      const stats = globalMarketOverviewService.getCacheStats()
      return NextResponse.json({ stats })
    }

    if (action === 'clear-cache') {
      globalMarketOverviewService.clearCache()
      return NextResponse.json({ 
        success: true, 
        message: 'Cache cleared successfully' 
      })
    }

    if (market) {
      // Get specific market status
      const marketStatus = await globalMarketOverviewService.getMarketStatus(market)
      return NextResponse.json(marketStatus)
    } else {
      // Get global market overview
      const overview = await globalMarketOverviewService.getGlobalMarketOverview()
      return NextResponse.json(overview)
    }
  } catch (error) {
    console.error('Global market overview error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch global market overview',
      fallback: true
    }, { status: 500 })
  }
}
