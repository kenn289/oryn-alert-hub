import { NextRequest, NextResponse } from 'next/server'
import { revenueAnalyticsService } from '../../../../src/lib/revenue-analytics-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    const analytics = await revenueAnalyticsService.getRevenueAnalytics()
    const chartData = await revenueAnalyticsService.getRevenueChartData(days)
    
    return NextResponse.json({
      analytics,
      chartData,
      success: true
    })
    
  } catch (error) {
    console.error('Revenue analytics API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch revenue analytics' 
    }, { status: 500 })
  }
}
