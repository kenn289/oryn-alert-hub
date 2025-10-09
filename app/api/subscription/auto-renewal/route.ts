import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { subscriptionLifecycleService } from '../../../../src/lib/subscription-lifecycle-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, enabled } = await request.json()
    
    if (!userId || typeof enabled !== 'boolean') {
      return NextResponse.json({ 
        error: 'User ID and enabled status are required' 
      }, { status: 400 })
    }
    
    // Update auto-renewal setting
    const result = await subscriptionLifecycleService.setupAutoRenewal(userId, enabled)
    
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
    console.error('Error updating auto-renewal:', error)
    return NextResponse.json({ 
      error: 'Failed to update auto-renewal setting' 
    }, { status: 500 })
  }
}

