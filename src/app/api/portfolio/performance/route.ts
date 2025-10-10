import { NextRequest, NextResponse } from 'next/server'
import { dailyPerformanceTrackingService } from '@/lib/daily-performance-tracking-service'
import { supabase } from '@/lib/supabase'

// GET /api/portfolio/performance - Get portfolio performance analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const days = parseInt(searchParams.get('days') || '30')
    const action = searchParams.get('action')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (action === 'chart-data') {
      const { data, error } = await supabase
        .rpc('get_performance_chart_data', {
          target_user_id: userId,
          days_back: days
        })

      if (error) {
        console.error('Error fetching chart data:', error)
        return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 })
      }

      return NextResponse.json({ chartData: data })
    }

    if (action === 'top-performers') {
      const { data, error } = await supabase
        .rpc('get_top_performers', {
          target_user_id: userId,
          limit_count: 5
        })

      if (error) {
        console.error('Error fetching top performers:', error)
        return NextResponse.json({ error: 'Failed to fetch top performers' }, { status: 500 })
      }

      return NextResponse.json({ topPerformers: data })
    }

    if (action === 'metrics') {
      const { data, error } = await supabase
        .rpc('calculate_daily_performance_metrics', {
          target_user_id: userId,
          target_date: new Date().toISOString().split('T')[0]
        })

      if (error) {
        console.error('Error calculating metrics:', error)
        return NextResponse.json({ error: 'Failed to calculate metrics' }, { status: 500 })
      }

      return NextResponse.json({ metrics: data[0] || {} })
    }

    // Get comprehensive portfolio analytics
    const analytics = await dailyPerformanceTrackingService.getPortfolioAnalytics(userId, days)
    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Portfolio performance error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch portfolio performance data',
      fallback: true
    }, { status: 500 })
  }
}

// POST /api/portfolio/performance - Create daily snapshot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, portfolioData } = body

    if (!userId || !portfolioData) {
      return NextResponse.json({ error: 'User ID and portfolio data are required' }, { status: 400 })
    }

    const snapshot = await dailyPerformanceTrackingService.createDailySnapshot(userId, portfolioData)
    
    return NextResponse.json({
      success: true,
      snapshot,
      message: 'Daily performance snapshot created successfully'
    })
  } catch (error) {
    console.error('Portfolio performance POST error:', error)
    return NextResponse.json({ 
      error: 'Failed to create daily snapshot',
      fallback: true
    }, { status: 500 })
  }
}

// DELETE /api/portfolio/performance - Clear cache
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'clear-cache') {
      dailyPerformanceTrackingService.clearCache()
      return NextResponse.json({ 
        success: true, 
        message: 'Performance tracking cache cleared successfully' 
      })
    }

    if (action === 'cleanup-analytics') {
      const { error } = await supabase.rpc('cleanup_analytics_cache')
      
      if (error) {
        console.error('Error cleaning up analytics cache:', error)
        return NextResponse.json({ error: 'Failed to cleanup analytics cache' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Analytics cache cleaned up successfully' 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Portfolio performance DELETE error:', error)
    return NextResponse.json({ 
      error: 'Failed to perform cleanup operation',
      fallback: true
    }, { status: 500 })
  }
}
