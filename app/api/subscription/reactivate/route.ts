import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { subscriptionLifecycleService } from '../../../../src/lib/subscription-lifecycle-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Reactivate subscription
    const result = await subscriptionLifecycleService.reactivateSubscription(userId)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    return NextResponse.json({ 
      error: 'Failed to reactivate subscription' 
    }, { status: 500 })
  }
}

