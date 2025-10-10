import { NextRequest, NextResponse } from 'next/server'
import { subscriptionStatsService } from '../../../../lib/subscription-stats-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'stats'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let result

    switch (action) {
      case 'stats':
        result = await subscriptionStatsService.getSubscriptionStats()
        break

      case 'user-stats':
        result = await subscriptionStatsService.getUserStats()
        break

      case 'recalculate':
        result = await subscriptionStatsService.recalculateStats()
        break

      case 'sync-razorpay':
        result = await subscriptionStatsService.syncWithRazorpay()
        break

      case 'date-range':
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })
        }
        result = await subscriptionStatsService.getStatsForDateRange(startDate, endDate)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Subscription stats API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch subscription statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    let result

    switch (action) {
      case 'recalculate':
        result = await subscriptionStatsService.recalculateStats()
        break

      case 'sync-razorpay':
        result = await subscriptionStatsService.syncWithRazorpay()
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Action '${action}' completed successfully`,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Subscription stats POST error:', error)
    return NextResponse.json({ 
      error: 'Failed to execute action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
