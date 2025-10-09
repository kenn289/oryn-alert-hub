import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      console.error('Missing Razorpay signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log('Razorpay webhook event:', event.type)

    // Handle different payment events
    switch (event.type) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity)
        break
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity)
        break
      
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity)
        break
      
      default:
        console.log('Unhandled webhook event:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    console.log('Payment captured:', payment.id)
    
    // Update payment status in database
    const { error } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        payment_id: payment.id,
        paid_at: new Date().toISOString()
      })
      .eq('order_id', payment.order_id)

    if (error) {
      console.error('Error updating payment status:', error)
    }

    // Create or update user subscription
    const { data: orderData } = await supabase
      .from('payment_orders')
      .select('user_id, plan')
      .eq('order_id', payment.order_id)
      .single()

    if (orderData) {
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 7) // 7-day trial

      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: orderData.user_id,
          plan: orderData.plan,
          status: 'active',
          trial: true,
          trial_ends_at: trialEndsAt.toISOString(),
          updated_at: new Date().toISOString()
        })

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError)
      }
    }

  } catch (error) {
    console.error('Error handling payment captured:', error)
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    console.log('Payment failed:', payment.id)
    
    // Update payment status in database
    const { error } = await supabase
      .from('payment_orders')
      .update({
        status: 'failed',
        payment_id: payment.id,
        failed_at: new Date().toISOString()
      })
      .eq('order_id', payment.order_id)

    if (error) {
      console.error('Error updating failed payment status:', error)
    }

  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function handleOrderPaid(order: any) {
  try {
    console.log('Order paid:', order.id)
    
    // Additional order processing logic can be added here
    // This event is triggered when an order is fully paid

  } catch (error) {
    console.error('Error handling order paid:', error)
  }
}

