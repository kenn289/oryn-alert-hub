import { NextRequest, NextResponse } from 'next/server'
import { paymentStateService } from '../../../../lib/payment-state-service'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')
    const userId = searchParams.get('user_id')

    if (!orderId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get payment state
    const paymentState = await paymentStateService.getPaymentState(orderId)
    
    if (!paymentState) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Check if payment has expired
    if (paymentState.status === 'pending' && new Date(paymentState.expiresAt) < new Date()) {
      await paymentStateService.updatePaymentState(orderId, 'expired')
      paymentState.status = 'expired'
    }

    return NextResponse.json({
      success: true,
      payment: {
        orderId: paymentState.orderId,
        status: paymentState.status,
        plan: paymentState.plan,
        amount: paymentState.amount,
        currency: paymentState.currency,
        createdAt: paymentState.createdAt,
        expiresAt: paymentState.expiresAt,
        errorMessage: paymentState.errorMessage
      }
    })

  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, userId, action } = await request.json()

    if (!orderId || !userId || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get payment state
    const paymentState = await paymentStateService.getPaymentState(orderId)
    
    if (!paymentState) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (paymentState.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    let success = false
    let message = ''

    switch (action) {
      case 'cancel':
        success = await paymentStateService.handlePaymentCancellation(orderId)
        message = success ? 'Payment cancelled successfully' : 'Failed to cancel payment'
        break

      case 'retry':
        if (paymentState.status === 'failed' || paymentState.status === 'expired') {
          // Create new payment state for retry
          const newPaymentState = await paymentStateService.createPaymentState(
            userId,
            orderId + '_retry_' + Date.now(),
            paymentState.plan,
            paymentState.amount,
            paymentState.currency
          )
          success = true
          message = 'New payment session created'
        } else {
          return NextResponse.json({ error: 'Cannot retry this payment' }, { status: 400 })
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success,
      message
    })

  } catch (error) {
    console.error('Payment action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
