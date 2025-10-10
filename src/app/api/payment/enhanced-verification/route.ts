import { NextRequest, NextResponse } from 'next/server'
import { EnhancedPaymentVerificationService } from '@/lib/enhanced-payment-verification-service'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      userEmail,
      userAgent,
      ipAddress,
      deviceFingerprint
    } = body

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !userEmail) {
      return NextResponse.json({
        success: false,
        error: 'Missing required payment verification fields',
        code: 'MISSING_FIELDS'
      }, { status: 400 })
    }

    // Get client IP and user agent if not provided
    const clientIP = ipAddress || request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const clientUserAgent = userAgent || request.headers.get('user-agent') || 'unknown'

    // Create verification request
    const verificationRequest = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      userEmail,
      userAgent: clientUserAgent,
      ipAddress: clientIP,
      deviceFingerprint
    }

    // Initialize enhanced verification service
    const verificationService = new EnhancedPaymentVerificationService()

    // Perform enhanced verification
    const startTime = Date.now()
    const result = await verificationService.verifyPayment(verificationRequest)
    const processingTime = Date.now() - startTime

    // Log verification attempt
    try {
      await supabase.from('payment_verification_logs').insert({
        user_id: userId,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        verification_status: result.success ? 'success' : 'failed',
        risk_score: result.verification?.riskScore || null,
        fraud_checks: result.verification?.fraudChecks || null,
        verification_steps: {
          signatureVerified: result.verification?.signatureVerified || false,
          userVerified: result.verification?.userVerified || false,
          orderVerified: result.verification?.orderVerified || false,
          subscriptionActivated: result.verification?.subscriptionActivated || false
        },
        processing_time_ms: processingTime,
        user_agent: clientUserAgent,
        ip_address: clientIP,
        device_fingerprint: deviceFingerprint
      })
    } catch (logError) {
      console.error('Error logging verification attempt:', logError)
      // Don't fail the verification for logging errors
    }

    // Return result
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        subscription: result.subscription,
        verification: result.verification,
        processingTime: processingTime
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: result.message,
        code: result.code,
        verification: result.verification,
        processingTime: processingTime
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Enhanced payment verification error:', error)
    
    // Log system error
    try {
      const body = await request.json()
      await supabase.from('system_errors').insert({
        user_id: body.userId || null,
        user_email: body.userEmail || null,
        order_id: body.razorpay_order_id || null,
        payment_id: body.razorpay_payment_id || null,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : null,
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        device_fingerprint: body.deviceFingerprint || null
      })
    } catch (logError) {
      console.error('Error logging system error:', logError)
    }

    return NextResponse.json({
      success: false,
      error: 'Payment verification failed due to a system error. Please contact support immediately.',
      code: 'SYSTEM_ERROR'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        error: 'User ID is required'
      }, { status: 400 })
    }

    switch (action) {
      case 'fraud-analytics':
        const { data: fraudData, error: fraudError } = await supabase
          .rpc('get_fraud_analytics')
        
        if (fraudError) {
          return NextResponse.json({
            error: 'Failed to fetch fraud analytics'
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          analytics: fraudData[0]
        })

      case 'verification-stats':
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_payment_verification_stats')
        
        if (statsError) {
          return NextResponse.json({
            error: 'Failed to fetch verification statistics'
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          stats: statsData[0]
        })

      case 'security-dashboard':
        const { data: dashboardData, error: dashboardError } = await supabase
          .from('admin_payment_security_dashboard')
          .select('*')
        
        if (dashboardError) {
          return NextResponse.json({
            error: 'Failed to fetch security dashboard data'
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          dashboard: dashboardData
        })

      case 'recent-attempts':
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('payment_verification_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (attemptsError) {
          return NextResponse.json({
            error: 'Failed to fetch recent verification attempts'
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          attempts: attemptsData
        })

      default:
        return NextResponse.json({
          error: 'Invalid action specified'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error fetching payment verification data:', error)
    return NextResponse.json({
      error: 'Failed to fetch payment verification data'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'cleanup-logs') {
      const { data, error } = await supabase.rpc('cleanup_old_verification_logs')
      
      if (error) {
        return NextResponse.json({
          error: 'Failed to cleanup old logs'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Cleaned up ${data} old log entries`
      })
    }

    return NextResponse.json({
      error: 'Invalid cleanup action'
    }, { status: 400 })

  } catch (error) {
    console.error('Error cleaning up logs:', error)
    return NextResponse.json({
      error: 'Failed to cleanup logs'
    }, { status: 500 })
  }
}
