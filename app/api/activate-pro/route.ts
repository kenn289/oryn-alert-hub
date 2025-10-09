import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    console.log(`🔧 Activating Pro for user: ${userId}`)

    // Create subscription without amount field
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    const { error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan: 'pro',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        currency: 'INR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (subError) {
      console.error('Subscription error:', subError)
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }

    console.log(`✅ Pro subscription activated for user: ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Pro subscription activated successfully!',
      subscription: {
        plan: 'pro',
        status: 'active',
        endDate: endDate.toISOString(),
        daysRemaining: Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }
    })

  } catch (error) {
    console.error('Activation error:', error)
    return NextResponse.json({ 
      error: 'Failed to activate subscription' 
    }, { status: 500 })
  }
}
