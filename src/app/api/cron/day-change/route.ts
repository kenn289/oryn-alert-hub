import { NextRequest, NextResponse } from 'next/server'
import { timezoneService } from '../../../../lib/timezone-service'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('🔄 Starting day change processing...')
    
    // Check for day changes across all markets
    const dayChangeEvents = await timezoneService.checkForDayChange()
    
    if (dayChangeEvents.length === 0) {
      console.log('ℹ️ No day changes detected')
      return NextResponse.json({
        success: true,
        message: 'No day changes detected',
        events: [],
        timestamp: new Date().toISOString()
      })
    }

    console.log(`📅 Found ${dayChangeEvents.length} day change events`)
    
    // Process each day change event
    const results = []
    for (const event of dayChangeEvents) {
      try {
        console.log(`🔄 Processing day change for ${event.market} on ${event.date}`)
        
        const success = await timezoneService.processDayChange(event.market, event.date)
        
        results.push({
          market: event.market,
          date: event.date,
          success,
          eventId: event.id
        })
        
        if (success) {
          console.log(`✅ Day change processed successfully for ${event.market}`)
        } else {
          console.log(`❌ Day change processing failed for ${event.market}`)
        }
      } catch (error) {
        console.error(`Error processing day change for ${event.market}:`, error)
        results.push({
          market: event.market,
          date: event.date,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          eventId: event.id
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    console.log(`✅ Day change processing completed: ${successCount} successful, ${failureCount} failed`)
    
    return NextResponse.json({
      success: true,
      message: 'Day change processing completed',
      events: dayChangeEvents,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error processing day changes:', error)
    return NextResponse.json({ 
      error: 'Failed to process day changes',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Allow GET for testing
export async function GET() {
  try {
    console.log('🧪 Testing day change detection...')
    
    const dayChangeEvents = await timezoneService.checkForDayChange()
    const allMarketStatuses = timezoneService.getAllMarketStatuses()
    
    return NextResponse.json({
      success: true,
      message: 'Day change detection test completed',
      dayChangeEvents,
      marketStatuses: allMarketStatuses,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error testing day change detection:', error)
    return NextResponse.json({ 
      error: 'Failed to test day change detection',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
