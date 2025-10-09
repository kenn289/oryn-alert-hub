import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      userId, 
      userEmail 
    } = await request.json()

    console.log(`🔐 SECURE PAYMENT VERIFICATION for user: ${userId}`)
    console.log(`📧 Email: ${userEmail}`)
    console.log(`💳 Payment ID: ${razorpay_payment_id}`)
    console.log(`📋 Order ID: ${razorpay_order_id}`)

    // Step 1: Validate all required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !userEmail) {
      console.error('❌ Missing required payment verification fields')
      return NextResponse.json({ 
        error: 'Missing required payment information. Please contact support if payment was successful.',
        code: 'MISSING_FIELDS'
      }, { status: 400 })
    }

    // Step 2: Verify Razorpay signature (CRITICAL SECURITY CHECK)
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ INVALID RAZORPAY SIGNATURE - POTENTIAL FRAUD ATTEMPT')
      console.error(`Expected: ${expectedSignature}`)
      console.error(`Received: ${razorpay_signature}`)
      return NextResponse.json({ 
        error: 'Invalid payment signature. This could be a security issue. Please contact support immediately.',
        code: 'INVALID_SIGNATURE'
      }, { status: 400 })
    }

    console.log('✅ Razorpay signature verified successfully')

    // Step 3: Verify user exists and matches
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .eq('email', userEmail)
      .single()

    if (userError || !userData) {
      console.error('❌ User verification failed:', userError)
      return NextResponse.json({ 
        error: 'User verification failed. Please contact support.',
        code: 'USER_VERIFICATION_FAILED'
      }, { status: 401 })
    }

    console.log('✅ User verified successfully')

    // Step 4: Check if order exists in our database
    const { data: orderData, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .eq('user_id', userId)
      .single()

    if (orderError || !orderData) {
      console.error('❌ Order not found in database:', orderError)
      return NextResponse.json({ 
        error: 'Payment order not found. Please contact support with your payment ID.',
        code: 'ORDER_NOT_FOUND'
      }, { status: 404 })
    }

    console.log('✅ Order found in database')

    // Step 5: Check if payment is already processed
    if (orderData.status === 'paid') {
      console.log('⚠️ Payment already processed - returning existing subscription')
      return NextResponse.json({
        success: true,
        message: 'Payment already verified and subscription is active.',
        alreadyProcessed: true,
        subscription: {
          plan: orderData.plan,
          status: 'active',
          paymentId: razorpay_payment_id
        }
      })
    }

    // Step 6: Update payment status to paid
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        payment_id: razorpay_payment_id,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('order_id', razorpay_order_id)

    if (updateError) {
      console.error('❌ Failed to update payment status:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update payment status. Please contact support.',
        code: 'UPDATE_FAILED'
      }, { status: 500 })
    }

    console.log('✅ Payment status updated to paid')

    // Step 7: Create/Update subscription
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    const { error: subError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan: orderData.plan || 'pro',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        currency: orderData.currency || 'INR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (subError) {
      console.error('❌ Failed to create subscription:', subError)
      return NextResponse.json({ 
        error: 'Payment verified but subscription creation failed. Please contact support.',
        code: 'SUBSCRIPTION_FAILED'
      }, { status: 500 })
    }

    console.log('✅ Subscription created/updated successfully')

    // Step 8: Create payment verification log
    await supabase
      .from('payment_verification_logs')
      .insert({
        user_id: userId,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        verification_status: 'success',
        verified_at: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      })

    console.log('✅ Payment verification completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Payment verified and Pro subscription activated successfully!',
      subscription: {
        plan: orderData.plan || 'pro',
        status: 'active',
        endDate: endDate.toISOString(),
        daysRemaining: Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      },
      verification: {
        signatureVerified: true,
        userVerified: true,
        orderVerified: true,
        subscriptionActivated: true
      }
    })

  } catch (error) {
    console.error('❌ CRITICAL ERROR in payment verification:', error)
    return NextResponse.json({ 
      error: 'Payment verification failed due to a system error. Please contact support immediately.',
      code: 'SYSTEM_ERROR'
    }, { status: 500 })
  }
}
