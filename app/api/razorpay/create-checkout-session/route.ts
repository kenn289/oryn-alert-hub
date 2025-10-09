import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_ROUVLcLuL7BfUs',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'Et0LtoI8QtpdDvYUkBgGfAlC',
})

export async function POST(request: NextRequest) {
  try {
    // Using hardcoded credentials as fallback

    // Using hardcoded Supabase credentials as fallback

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
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4NDg0NSwiZXhwIjoyMDc0OTYwODQ1fQ.JMLCsJjRBsO7baZ1-heVOSjYbxpH2N-Ff1JTCKjUJ50'
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
