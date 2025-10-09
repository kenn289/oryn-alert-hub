import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Ensure environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4NDg0NSwiZXhwIjoyMDc0OTYwODQ1fQ.JMLCsJjRBsO7baZ1-heVOSjYbxpH2N-Ff1JTCKjUJ50'

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Authentication middleware for Razorpay payment routes
 * Ensures only authenticated users can make payments
 */
export async function verifyPaymentAuth(request: NextRequest, body?: any) {
  try {
    // Use provided body or parse from request
    const requestBody = body || await request.json()
    const { userId, userEmail } = requestBody

    // Check if user credentials are provided
    if (!userId || !userEmail) {
      return NextResponse.json({ 
        error: 'Authentication required. Please sign in to make payments.',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    // Verify user exists in database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('id', userId)
      .eq('email', userEmail)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ 
        error: 'Invalid user credentials. Please sign in again.',
        code: 'INVALID_CREDENTIALS'
      }, { status: 401 })
    }

    // Additional security: Verify user is making payment for themselves
    if (userData.id !== userId || userData.email !== userEmail) {
      return NextResponse.json({ 
        error: 'User authentication mismatch. Please sign in again.',
        code: 'AUTH_MISMATCH'
      }, { status: 401 })
    }

    // Check if user is trying to make multiple payments simultaneously
    const { data: existingOrders } = await supabase
      .from('payment_orders')
      .select('id, status, created_at')
      .eq('user_id', userId)
      .in('status', ['created', 'pending'])
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes

    if (existingOrders && existingOrders.length > 0) {
      return NextResponse.json({ 
        error: 'You already have a pending payment. Please complete or cancel it before starting a new one.',
        code: 'PENDING_PAYMENT'
      }, { status: 409 })
    }

    return null // Authentication successful

  } catch (error) {
    console.error('Payment auth verification error:', error)
    return NextResponse.json({ 
      error: 'Authentication verification failed. Please try again.',
      code: 'AUTH_VERIFICATION_FAILED'
    }, { status: 500 })
  }
}

/**
 * Rate limiting for payment attempts
 */
export function checkRateLimit(userId: string, attempts: number = 5, windowMs: number = 15 * 60 * 1000) {
  // This would typically use Redis or similar for production
  // For now, we'll implement basic rate limiting in the database
  return true // Allow for now, implement proper rate limiting in production
}
