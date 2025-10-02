import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Missing Razorpay credentials')
      return NextResponse.json({ 
        error: 'Payment service not configured. Please contact support to enable payments.' 
      }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase credentials')
      return NextResponse.json({ 
        error: 'Database service not configured. Please contact support.' 
      }, { status: 500 })
    }

    const { plan, userId, userEmail } = await request.json()

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
    }

    // Validate plan
    const validPlans = ['pro']
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Plan pricing (in paise - Razorpay expects amount in smallest currency unit)
    const planPricing = {
      pro: 99900 // ₹999 in paise
    }

    const amount = planPricing[plan as keyof typeof planPricing]
    const currency = 'INR'

    // Create Razorpay order
    let order
    try {
      order = await razorpay.orders.create({
        amount: amount,
        currency: currency,
        receipt: `oryn_${plan}_${userId}_${Date.now()}`,
        notes: {
          plan: plan,
          userId: userId,
          userEmail: userEmail,
          trial: 'true' // This is a trial subscription
        }
      })
    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError)
      return NextResponse.json({ 
        error: 'Payment gateway is currently unavailable. Please try again later or contact support.' 
      }, { status: 500 })
    }

    // Store order details in database for verification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    try {
      const { error: dbError } = await supabase
        .from('payment_orders')
        .insert({
          order_id: order.id,
          user_id: userId,
          plan: plan,
          amount: amount,
          currency: currency,
          status: 'created',
          trial: true,
          created_at: new Date().toISOString()
        })

      if (dbError) {
        console.error('Database error:', dbError)
        return NextResponse.json({ 
          error: 'Failed to process payment order. Please try again.' 
        }, { status: 500 })
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json({ 
        error: 'Database service is temporarily unavailable. Please try again later.' 
      }, { status: 500 })
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    })

  } catch (error) {
    console.error('Razorpay order creation error:', error)
    return NextResponse.json({ 
      error: 'Payment service is temporarily unavailable. Please try again later or contact support.' 
    }, { status: 500 })
  }
}
