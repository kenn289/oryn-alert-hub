import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { verifyPaymentAuth } from '../middleware'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    // Parse request body once
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, userEmail } = await request.json()
    
    // Verify authentication using middleware with parsed body
    const authError = await verifyPaymentAuth(request, { userId, userEmail })
    if (authError) {
      return authError
    }

    // Check required payment details
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ 
        error: 'Missing payment details. Please try the payment again.' 
      }, { status: 400 })
    }

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Get order details from database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: orderData, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .eq('user_id', userId)
      .single()

    if (orderError || !orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order status to paid
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        payment_id: razorpay_payment_id,
        paid_at: new Date().toISOString()
      })
      .eq('order_id', razorpay_order_id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
    }

    // Activate subscription using the lifecycle service
    try {
      const { subscriptionLifecycleService } = await import('../../../../src/lib/subscription-lifecycle-service')
      const { invoiceService } = await import('../../../../src/lib/invoice-service')
      const { emailService } = await import('../../../../src/lib/email-service')
      
      // Get user details
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single()
      
      const userName = userData?.name || 'User'
      
      // Activate subscription
      const subscription = await subscriptionLifecycleService.activateSubscription(
        userId,
        orderData.plan,
        orderData.amount,
        orderData.currency || 'INR',
        false, // Not a trial for paid subscriptions
        0 // No trial days
      )
      
      // Update invoice status if exists
      if (orderData.invoice_id) {
        await invoiceService.updateInvoiceStatus(
          orderData.invoice_id,
          'paid',
          razorpay_payment_id
        )
        
        // Send payment confirmation email
        const invoice = await invoiceService.getInvoice(orderData.invoice_id)
        if (invoice) {
          await emailService.sendPaymentConfirmationEmail(invoice)
        }
      }
      
      console.log('✅ Subscription activated successfully for user:', userId)
      
      return NextResponse.json({
        success: true,
        message: 'Payment verified and subscription activated successfully!',
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          daysRemaining: subscription.daysRemaining,
          endDate: subscription.endDate
        }
      })
      
    } catch (activationError) {
      console.error('Error activating subscription:', activationError)
      return NextResponse.json({ 
        error: 'Payment verified but subscription activation failed. Please contact support.' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ 
      error: 'Payment verification failed. Please contact support if the payment was successful.' 
    }, { status: 500 })
  }
}

