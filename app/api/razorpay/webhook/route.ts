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
    console.log('🔔 Razorpay webhook event received:', event.type)

    // Import webhook logging service
    const { webhookLoggingService } = await import('../../../../src/lib/webhook-logging-service')

    // Process webhook with comprehensive logging
    const success = await webhookLoggingService.processWebhookEvent(
      event.type,
      event.event_id || event.id,
      event,
      event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id,
      event.payload?.payment?.entity?.id,
      event.payload?.payment?.entity?.notes?.userId,
      event.payload?.payment?.entity?.amount,
      event.payload?.payment?.entity?.currency
    )

    if (!success) {
      console.error('❌ Failed to process webhook event:', event.type)
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }

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
        console.log('ℹ️ Unhandled webhook event:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    console.log('💰 Payment captured:', payment.id)
    
    // Import services
    const { paymentStateService } = await import('../../../../src/lib/payment-state-service')
    const { webhookLoggingService } = await import('../../../../src/lib/webhook-logging-service')
    
    // Handle payment success using payment state service
    const success = await paymentStateService.handlePaymentSuccess(
      payment.order_id,
      payment.id
    )

    if (!success) {
      console.error('Failed to handle payment success for order:', payment.order_id)
      return
    }

    // Confirm revenue transaction
    await webhookLoggingService.confirmRevenueTransaction(
      payment.order_id,
      payment.id
    )

    // Also update payment_orders for backward compatibility
    const { error } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        payment_id: payment.id,
        paid_at: new Date().toISOString()
      })
      .eq('order_id', payment.order_id)

    if (error) {
      console.error('Error updating payment_orders:', error)
    }

    console.log('✅ Payment processed and revenue confirmed for order:', payment.order_id)

  } catch (error) {
    console.error('Error handling payment captured:', error)
    
    // Mark revenue transaction as failed
    const { webhookLoggingService } = await import('../../../../src/lib/webhook-logging-service')
    await webhookLoggingService.markRevenueTransactionFailed(
      payment.order_id,
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    console.log('Payment failed:', payment.id)
    
    // Import payment state service
    const { paymentStateService } = await import('../../../../src/lib/payment-state-service')
    
    // Handle payment failure using payment state service
    const success = await paymentStateService.handlePaymentFailure(
      payment.order_id,
      payment.error_description || 'Payment failed'
    )

    if (!success) {
      console.error('Failed to handle payment failure for order:', payment.order_id)
    }

    // Also update payment_orders for backward compatibility
    const { error } = await supabase
      .from('payment_orders')
      .update({
        status: 'failed',
        payment_id: payment.id,
        failed_at: new Date().toISOString()
      })
      .eq('order_id', payment.order_id)

    if (error) {
      console.error('Error updating payment_orders:', error)
    }

    console.log('❌ Payment failed for order:', payment.order_id)

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

