import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'test_service_role_key'
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get current subscription
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (fetchError || !subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Update subscription status to cancelled
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active')

    if (updateError) {
      console.error('Error cancelling subscription:', updateError)
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
    }

    // Log the cancellation for audit purposes
    const { error: logError } = await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: 'cancelled',
        subscription_id: subscription.id,
        plan: subscription.plan,
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging cancellation:', logError)
      // Don't fail the request for logging errors
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      cancelledAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

