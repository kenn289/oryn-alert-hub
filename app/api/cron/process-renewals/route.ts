import { NextRequest, NextResponse } from 'next/server'
import { subscriptionLifecycleService } from '../../../../src/lib/subscription-lifecycle-service'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (you might want to add authentication)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('🔄 Starting subscription renewal processing...')
    
    // Process renewals
    const result = await subscriptionLifecycleService.processRenewals()
    
    console.log(`✅ Renewal processing completed: ${result.processed} processed, ${result.errors} errors`)
    
    return NextResponse.json({
      success: true,
      message: 'Renewal processing completed',
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error processing renewals:', error)
    return NextResponse.json({ 
      error: 'Failed to process renewals',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Allow GET for testing
export async function GET() {
  try {
    console.log('🧪 Testing renewal processing...')
    
    const result = await subscriptionLifecycleService.processRenewals()
    
    return NextResponse.json({
      success: true,
      message: 'Test renewal processing completed',
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error testing renewals:', error)
    return NextResponse.json({ 
      error: 'Failed to test renewals',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

