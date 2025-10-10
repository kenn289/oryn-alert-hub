import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { PaymentStateService } from './payment-state-service'
import { WebhookLoggingService } from './webhook-logging-service'
import { SubscriptionLifecycleService } from './subscription-lifecycle-service'
import { EmailService } from './email-service'
import { NotificationService } from './notification-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export interface PaymentVerificationResult {
  success: boolean
  message: string
  subscription?: {
    plan: string
    status: string
    endDate: string
    daysRemaining: number
    paymentId: string
    orderId: string
  }
  verification?: {
    signatureVerified: boolean
    userVerified: boolean
    orderVerified: boolean
    subscriptionActivated: boolean
    riskScore: number
    fraudChecks: string[]
  }
  error?: string
  code?: string
}

export interface PaymentVerificationRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  userId: string
  userEmail: string
  userAgent?: string
  ipAddress?: string
  deviceFingerprint?: string
}

export interface FraudCheckResult {
  check: string
  passed: boolean
  score: number
  details: string
}

export class EnhancedPaymentVerificationService {
  private paymentStateService: PaymentStateService
  private webhookLoggingService: WebhookLoggingService
  private subscriptionLifecycleService: SubscriptionLifecycleService
  private emailService: EmailService
  private notificationService: NotificationService

  constructor() {
    this.paymentStateService = new PaymentStateService()
    this.webhookLoggingService = new WebhookLoggingService()
    this.subscriptionLifecycleService = new SubscriptionLifecycleService()
    this.emailService = new EmailService()
    this.notificationService = new NotificationService()
  }

  /**
   * Enhanced payment verification with fraud detection and security checks
   */
  async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResult> {
    try {
      console.log('🔐 ENHANCED PAYMENT VERIFICATION for user:', request.userId)
      console.log('📧 Email:', request.userEmail)
      console.log('💳 Payment ID:', request.razorpay_payment_id)
      console.log('📋 Order ID:', request.razorpay_order_id)

      // Step 1: Validate required fields
      const validationResult = this.validateRequest(request)
      if (!validationResult.valid) {
        return {
          success: false,
          message: validationResult.message,
          error: validationResult.message,
          code: 'INVALID_REQUEST'
        }
      }

      // Step 2: Perform fraud detection checks
      const fraudChecks = await this.performFraudChecks(request)
      const riskScore = fraudChecks.reduce((sum, check) => sum + check.score, 0) / fraudChecks.length

      if (riskScore > 0.7) {
        console.error('🚨 HIGH RISK PAYMENT DETECTED - Risk Score:', riskScore)
        await this.logFraudAttempt(request, fraudChecks, riskScore)
        
        return {
          success: false,
          message: 'Payment verification failed due to security concerns. Please contact support.',
          error: 'High risk payment detected',
          code: 'HIGH_RISK_PAYMENT'
        }
      }

      // Step 3: Verify Razorpay signature
      const signatureValid = this.verifyRazorpaySignature(
        request.razorpay_order_id,
        request.razorpay_payment_id,
        request.razorpay_signature
      )

      if (!signatureValid) {
        console.error('❌ INVALID RAZORPAY SIGNATURE - POTENTIAL FRAUD ATTEMPT')
        await this.logSecurityViolation(request, 'INVALID_SIGNATURE')
        
        return {
          success: false,
          message: 'Invalid payment signature. This could be a security issue. Please contact support immediately.',
          error: 'Invalid payment signature',
          code: 'INVALID_SIGNATURE'
        }
      }

      console.log('✅ Razorpay signature verified successfully')

      // Step 4: Verify user exists and matches
      const userVerification = await this.verifyUser(request.userId, request.userEmail)
      if (!userVerification.valid) {
        console.error('❌ User verification failed:', userVerification.error)
        await this.logSecurityViolation(request, 'USER_VERIFICATION_FAILED')
        
        return {
          success: false,
          message: 'User verification failed. Please contact support.',
          error: userVerification.error,
          code: 'USER_VERIFICATION_FAILED'
        }
      }

      console.log('✅ User verified successfully')

      // Step 5: Check if order exists and get details
      const orderVerification = await this.verifyOrder(request.razorpay_order_id, request.userId)
      if (!orderVerification.valid) {
        console.error('❌ Order verification failed:', orderVerification.error)
        await this.logSecurityViolation(request, 'ORDER_VERIFICATION_FAILED')
        
        return {
          success: false,
          message: 'Payment order not found. Please contact support with your payment ID.',
          error: orderVerification.error,
          code: 'ORDER_NOT_FOUND'
        }
      }

      console.log('✅ Order verified successfully')

      // Step 6: Check if payment is already processed
      if (orderVerification.orderData.status === 'paid') {
        console.log('⚠️ Payment already processed - returning existing subscription')
        return {
          success: true,
          message: 'Payment already verified and subscription is active.',
          subscription: {
            plan: orderVerification.orderData.plan,
            status: 'active',
            endDate: orderVerification.orderData.end_date,
            daysRemaining: Math.ceil((new Date(orderVerification.orderData.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
            paymentId: request.razorpay_payment_id,
            orderId: request.razorpay_order_id
          },
          verification: {
            signatureVerified: true,
            userVerified: true,
            orderVerified: true,
            subscriptionActivated: true,
            riskScore,
            fraudChecks: fraudChecks.map(check => check.check)
          }
        }
      }

      // Step 7: Update payment status and activate subscription
      const activationResult = await this.activatePaymentAndSubscription(
        request.razorpay_order_id,
        request.razorpay_payment_id,
        orderVerification.orderData
      )

      if (!activationResult.success) {
        console.error('❌ Payment activation failed:', activationResult.error)
        await this.logPaymentFailure(request, activationResult.error)
        
        return {
          success: false,
          message: 'Payment verification succeeded but subscription activation failed. Please contact support.',
          error: activationResult.error,
          code: 'ACTIVATION_FAILED'
        }
      }

      console.log('✅ Payment verification and subscription activation completed successfully')

      // Step 8: Send confirmation notifications
      await this.sendConfirmationNotifications(request.userId, request.userEmail, orderVerification.orderData)

      return {
        success: true,
        message: 'Payment verified and Pro subscription activated successfully!',
        subscription: {
          plan: orderVerification.orderData.plan,
          status: 'active',
          endDate: activationResult.subscription.end_date,
          daysRemaining: activationResult.subscription.daysRemaining,
          paymentId: request.razorpay_payment_id,
          orderId: request.razorpay_order_id
        },
        verification: {
          signatureVerified: true,
          userVerified: true,
          orderVerified: true,
          subscriptionActivated: true,
          riskScore,
          fraudChecks: fraudChecks.map(check => check.check)
        }
      }

    } catch (error) {
      console.error('❌ CRITICAL ERROR in enhanced payment verification:', error)
      await this.logSystemError(request, error)
      
      return {
        success: false,
        message: 'Payment verification failed due to a system error. Please contact support immediately.',
        error: 'System error during verification',
        code: 'SYSTEM_ERROR'
      }
    }
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: PaymentVerificationRequest): { valid: boolean; message: string } {
    if (!request.razorpay_order_id || !request.razorpay_payment_id || !request.razorpay_signature || !request.userId || !request.userEmail) {
      return {
        valid: false,
        message: 'Missing required payment information. Please contact support if payment was successful.'
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(request.userEmail)) {
      return {
        valid: false,
        message: 'Invalid email format provided.'
      }
    }

    // Validate UUID format for userId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(request.userId)) {
      return {
        valid: false,
        message: 'Invalid user ID format.'
      }
    }

    return { valid: true, message: '' }
  }

  /**
   * Perform comprehensive fraud detection checks
   */
  private async performFraudChecks(request: PaymentVerificationRequest): Promise<FraudCheckResult[]> {
    const checks: FraudCheckResult[] = []

    // Check 1: Email domain validation
    const emailDomain = request.userEmail.split('@')[1]
    const suspiciousDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com']
    checks.push({
      check: 'email_domain',
      passed: !suspiciousDomains.includes(emailDomain),
      score: suspiciousDomains.includes(emailDomain) ? 0.8 : 0.1,
      details: `Email domain: ${emailDomain}`
    })

    // Check 2: User agent validation
    if (request.userAgent) {
      const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper']
      const isSuspicious = suspiciousAgents.some(agent => 
        request.userAgent!.toLowerCase().includes(agent)
      )
      checks.push({
        check: 'user_agent',
        passed: !isSuspicious,
        score: isSuspicious ? 0.7 : 0.1,
        details: `User agent: ${request.userAgent}`
      })
    }

    // Check 3: IP address validation (if provided)
    if (request.ipAddress) {
      const isPrivateIP = request.ipAddress.startsWith('192.168.') || 
                         request.ipAddress.startsWith('10.') || 
                         request.ipAddress.startsWith('172.')
      checks.push({
        check: 'ip_address',
        passed: !isPrivateIP,
        score: isPrivateIP ? 0.6 : 0.1,
        details: `IP address: ${request.ipAddress}`
      })
    }

    // Check 4: Recent payment attempts
    const recentAttempts = await this.checkRecentPaymentAttempts(request.userId)
    checks.push({
      check: 'recent_attempts',
      passed: recentAttempts < 3,
      score: recentAttempts >= 3 ? 0.9 : 0.1,
      details: `Recent payment attempts: ${recentAttempts}`
    })

    // Check 5: Device fingerprint validation (if provided)
    if (request.deviceFingerprint) {
      const fingerprintChecks = await this.validateDeviceFingerprint(request.deviceFingerprint, request.userId)
      checks.push({
        check: 'device_fingerprint',
        passed: fingerprintChecks.valid,
        score: fingerprintChecks.valid ? 0.1 : 0.5,
        details: `Device fingerprint: ${fingerprintChecks.details}`
      })
    }

    return checks
  }

  /**
   * Verify Razorpay signature
   */
  private verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
    try {
      const body = orderId + "|" + paymentId
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex')

      return expectedSignature === signature
    } catch (error) {
      console.error('Error verifying Razorpay signature:', error)
      return false
    }
  }

  /**
   * Verify user exists and matches
   */
  private async verifyUser(userId: string, userEmail: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', userId)
        .eq('email', userEmail)
        .single()

      if (userError || !userData) {
        return { valid: false, error: userError?.message || 'User not found' }
      }

      return { valid: true }
    } catch (error) {
      console.error('Error verifying user:', error)
      return { valid: false, error: 'User verification failed' }
    }
  }

  /**
   * Verify order exists and get details
   */
  private async verifyOrder(orderId: string, userId: string): Promise<{ valid: boolean; orderData?: any; error?: string }> {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('order_id', orderId)
        .eq('user_id', userId)
        .single()

      if (orderError || !orderData) {
        return { valid: false, error: orderError?.message || 'Order not found' }
      }

      return { valid: true, orderData }
    } catch (error) {
      console.error('Error verifying order:', error)
      return { valid: false, error: 'Order verification failed' }
    }
  }

  /**
   * Activate payment and subscription
   */
  private async activatePaymentAndSubscription(orderId: string, paymentId: string, orderData: any): Promise<{ success: boolean; subscription?: any; error?: string }> {
    try {
      // Update payment status using payment state service
      const paymentSuccess = await this.paymentStateService.handlePaymentSuccess(orderId, paymentId)
      
      if (!paymentSuccess) {
        return { success: false, error: 'Failed to update payment state' }
      }

      // Activate subscription using lifecycle service
      const subscription = await this.subscriptionLifecycleService.activateSubscription(
        orderData.user_id,
        orderData.plan,
        orderData.amount,
        orderData.currency || 'INR',
        false // Not a trial
      )

      return { success: true, subscription }
    } catch (error) {
      console.error('Error activating payment and subscription:', error)
      return { success: false, error: 'Failed to activate subscription' }
    }
  }

  /**
   * Send confirmation notifications
   */
  private async sendConfirmationNotifications(userId: string, userEmail: string, orderData: any): Promise<void> {
    try {
      // Send email confirmation
      await this.emailService.sendPaymentConfirmationEmail({
        userEmail,
        userName: orderData.user_name || 'User',
        plan: orderData.plan,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        paymentId: orderData.payment_id
      })

      // Send in-app notification
      await this.notificationService.createNotification({
        userId,
        type: 'payment_success',
        title: 'Payment Successful!',
        message: `Your ${orderData.plan} subscription has been activated successfully.`,
        data: {
          plan: orderData.plan,
          amount: orderData.amount,
          currency: orderData.currency
        }
      })
    } catch (error) {
      console.error('Error sending confirmation notifications:', error)
      // Don't fail the entire process for notification errors
    }
  }

  /**
   * Check recent payment attempts
   */
  private async checkRecentPaymentAttempts(userId: string): Promise<number> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
      const { count } = await supabase
        .from('payment_orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo)

      return count || 0
    } catch (error) {
      console.error('Error checking recent payment attempts:', error)
      return 0
    }
  }

  /**
   * Validate device fingerprint
   */
  private async validateDeviceFingerprint(fingerprint: string, userId: string): Promise<{ valid: boolean; details: string }> {
    try {
      // Check if this fingerprint has been used recently by different users
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      const { data: recentUsage } = await supabase
        .from('payment_orders')
        .select('user_id')
        .eq('device_fingerprint', fingerprint)
        .gte('created_at', oneDayAgo)
        .neq('user_id', userId)

      if (recentUsage && recentUsage.length > 0) {
        return {
          valid: false,
          details: 'Device fingerprint used by multiple users recently'
        }
      }

      return {
        valid: true,
        details: 'Device fingerprint validated'
      }
    } catch (error) {
      console.error('Error validating device fingerprint:', error)
      return {
        valid: true, // Default to valid if validation fails
        details: 'Device fingerprint validation failed'
      }
    }
  }

  /**
   * Log fraud attempt
   */
  private async logFraudAttempt(request: PaymentVerificationRequest, fraudChecks: FraudCheckResult[], riskScore: number): Promise<void> {
    try {
      await supabase.from('fraud_attempts').insert({
        user_id: request.userId,
        user_email: request.userEmail,
        order_id: request.razorpay_order_id,
        payment_id: request.razorpay_payment_id,
        risk_score: riskScore,
        fraud_checks: fraudChecks,
        user_agent: request.userAgent,
        ip_address: request.ipAddress,
        device_fingerprint: request.deviceFingerprint,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error logging fraud attempt:', error)
    }
  }

  /**
   * Log security violation
   */
  private async logSecurityViolation(request: PaymentVerificationRequest, violationType: string): Promise<void> {
    try {
      await supabase.from('security_violations').insert({
        user_id: request.userId,
        user_email: request.userEmail,
        order_id: request.razorpay_order_id,
        payment_id: request.razorpay_payment_id,
        violation_type: violationType,
        user_agent: request.userAgent,
        ip_address: request.ipAddress,
        device_fingerprint: request.deviceFingerprint,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error logging security violation:', error)
    }
  }

  /**
   * Log payment failure
   */
  private async logPaymentFailure(request: PaymentVerificationRequest, error: string): Promise<void> {
    try {
      await supabase.from('payment_failures').insert({
        user_id: request.userId,
        user_email: request.userEmail,
        order_id: request.razorpay_order_id,
        payment_id: request.razorpay_payment_id,
        error_message: error,
        user_agent: request.userAgent,
        ip_address: request.ipAddress,
        device_fingerprint: request.deviceFingerprint,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error logging payment failure:', error)
    }
  }

  /**
   * Log system error
   */
  private async logSystemError(request: PaymentVerificationRequest, error: any): Promise<void> {
    try {
      await supabase.from('system_errors').insert({
        user_id: request.userId,
        user_email: request.userEmail,
        order_id: request.razorpay_order_id,
        payment_id: request.razorpay_payment_id,
        error_message: error.message || 'Unknown system error',
        error_stack: error.stack,
        user_agent: request.userAgent,
        ip_address: request.ipAddress,
        device_fingerprint: request.deviceFingerprint,
        created_at: new Date().toISOString()
      })
    } catch (logError) {
      console.error('Error logging system error:', logError)
    }
  }
}
