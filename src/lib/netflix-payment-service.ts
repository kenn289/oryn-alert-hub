import { createClient } from '@supabase/supabase-js'
import { invoiceService, InvoiceData } from './invoice-service'
import { emailService } from './email-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export interface PaymentResult {
  success: boolean
  message: string
  invoice?: InvoiceData
  paymentUrl?: string
  error?: string
}

export interface PaymentScenario {
  type: 'new_subscription' | 'renewal' | 'upgrade' | 'downgrade' | 'retry' | 'refund'
  userId: string
  userEmail: string
  userName: string
  plan: string
  amount: number
  currency?: string
  previousPlan?: string
  retryCount?: number
}

export class NetflixPaymentService {
  /**
   * Handle all payment scenarios like Netflix
   */
  async processPayment(scenario: PaymentScenario): Promise<PaymentResult> {
    try {
      console.log('🎬 Processing payment scenario:', scenario.type)
      
      // Step 1: Validate user and plan
      const validation = await this.validatePayment(scenario)
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'Payment validation failed',
          error: 'VALIDATION_FAILED'
        }
      }
      
      // Step 2: Generate invoice
      const invoice = await invoiceService.generateInvoice(
        scenario.userId,
        scenario.userEmail,
        scenario.userName,
        scenario.plan,
        scenario.amount,
        scenario.currency || 'INR'
      )
      
      // Step 3: Handle specific scenario
      let result: PaymentResult
      
      switch (scenario.type) {
        case 'new_subscription':
          result = await this.handleNewSubscription(scenario, invoice)
          break
        case 'renewal':
          result = await this.handleRenewal(scenario, invoice)
          break
        case 'upgrade':
          result = await this.handleUpgrade(scenario, invoice)
          break
        case 'downgrade':
          result = await this.handleDowngrade(scenario, invoice)
          break
        case 'retry':
          result = await this.handleRetry(scenario, invoice)
          break
        case 'refund':
          result = await this.handleRefund(scenario, invoice)
          break
        default:
          throw new Error('Unknown payment scenario')
      }
      
      // Step 4: Send appropriate emails
      await this.sendScenarioEmails(scenario, invoice, result)
      
      return result
      
    } catch (error) {
      console.error('Payment processing error:', error)
      return {
        success: false,
        message: 'Payment processing failed. Please try again.',
        error: 'PROCESSING_ERROR'
      }
    }
  }
  
  /**
   * Validate payment request
   */
  private async validatePayment(scenario: PaymentScenario): Promise<{valid: boolean, error?: string}> {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', scenario.userId)
      .eq('email', scenario.userEmail)
      .single()
    
    if (userError || !user) {
      return { valid: false, error: 'User not found or invalid credentials' }
    }
    
    // Check for existing pending payments
    const { data: pendingPayments } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('user_id', scenario.userId)
      .in('status', ['pending', 'processing'])
    
    if (pendingPayments && pendingPayments.length > 0) {
      return { valid: false, error: 'You have a pending payment. Please complete it first.' }
    }
    
    // Check retry limits
    if (scenario.type === 'retry' && (scenario.retryCount || 0) > 3) {
      return { valid: false, error: 'Maximum retry attempts exceeded. Please contact support.' }
    }
    
    return { valid: true }
  }
  
  /**
   * Handle new subscription
   */
  private async handleNewSubscription(scenario: PaymentScenario, invoice: InvoiceData): Promise<PaymentResult> {
    console.log('🆕 Handling new subscription')
    
    // Create Razorpay order
    const order = await this.createRazorpayOrder(invoice)
    
    return {
      success: true,
      message: 'Welcome to Oryn Pro! Please complete your payment.',
      invoice,
      paymentUrl: `/payment/${invoice.id}`
    }
  }
  
  /**
   * Handle subscription renewal
   */
  private async handleRenewal(scenario: PaymentScenario, invoice: InvoiceData): Promise<PaymentResult> {
    console.log('🔄 Handling subscription renewal')
    
    // Check if user has active subscription
    const { data: activeSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', scenario.userId)
      .eq('status', 'active')
      .single()
    
    if (activeSubscription) {
      // Extend existing subscription
      const newEndDate = new Date(activeSubscription.ends_at)
      newEndDate.setMonth(newEndDate.getMonth() + 1)
      
      await supabase
        .from('user_subscriptions')
        .update({
          ends_at: newEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', activeSubscription.id)
    }
    
    const order = await this.createRazorpayOrder(invoice)
    
    return {
      success: true,
      message: 'Subscription renewed successfully!',
      invoice,
      paymentUrl: `/payment/${invoice.id}`
    }
  }
  
  /**
   * Handle plan upgrade
   */
  private async handleUpgrade(scenario: PaymentScenario, invoice: InvoiceData): Promise<PaymentResult> {
    console.log('⬆️ Handling plan upgrade')
    
    // Calculate prorated amount
    const proratedAmount = await this.calculateProratedAmount(
      scenario.userId,
      scenario.previousPlan!,
      scenario.plan,
      scenario.amount
    )
    
    // Update invoice with prorated amount
    invoice.amount = proratedAmount
    invoice.total = proratedAmount + invoice.tax
    
    const order = await this.createRazorpayOrder(invoice)
    
    return {
      success: true,
      message: 'Plan upgraded successfully!',
      invoice,
      paymentUrl: `/payment/${invoice.id}`
    }
  }
  
  /**
   * Handle plan downgrade
   */
  private async handleDowngrade(scenario: PaymentScenario, invoice: InvoiceData): Promise<PaymentResult> {
    console.log('⬇️ Handling plan downgrade')
    
    // Calculate credit amount
    const creditAmount = await this.calculateCreditAmount(
      scenario.userId,
      scenario.previousPlan!,
      scenario.plan
    )
    
    // Apply credit to invoice
    invoice.amount = Math.max(0, invoice.amount - creditAmount)
    invoice.total = invoice.amount + invoice.tax
    
    const order = await this.createRazorpayOrder(invoice)
    
    return {
      success: true,
      message: 'Plan downgraded successfully!',
      invoice,
      paymentUrl: `/payment/${invoice.id}`
    }
  }
  
  /**
   * Handle payment retry
   */
  private async handleRetry(scenario: PaymentScenario, invoice: InvoiceData): Promise<PaymentResult> {
    console.log('🔄 Handling payment retry')
    
    // Check retry count
    const retryCount = scenario.retryCount || 0
    if (retryCount > 3) {
      return {
        success: false,
        message: 'Maximum retry attempts exceeded. Please contact support.',
        error: 'MAX_RETRIES_EXCEEDED'
      }
    }
    
    const order = await this.createRazorpayOrder(invoice)
    
    return {
      success: true,
      message: 'Payment retry initiated. Please complete your payment.',
      invoice,
      paymentUrl: `/payment/${invoice.id}`
    }
  }
  
  /**
   * Handle refund
   */
  private async handleRefund(scenario: PaymentScenario, invoice: InvoiceData): Promise<PaymentResult> {
    console.log('💰 Handling refund')
    
    // Process refund through Razorpay
    const refund = await this.processRazorpayRefund(invoice)
    
    if (refund.success) {
      // Update subscription status
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('user_id', scenario.userId)
      
      return {
        success: true,
        message: 'Refund processed successfully.',
        invoice
      }
    } else {
      return {
        success: false,
        message: 'Refund processing failed. Please contact support.',
        error: 'REFUND_FAILED'
      }
    }
  }
  
  /**
   * Create Razorpay order
   */
  private async createRazorpayOrder(invoice: InvoiceData): Promise<any> {
    // This would integrate with Razorpay API
    console.log('💳 Creating Razorpay order for invoice:', invoice.id)
    
    // Mock order creation
    return {
      id: `order_${Date.now()}`,
      amount: invoice.total * 100, // Convert to paise
      currency: invoice.currency,
      receipt: invoice.id
    }
  }
  
  /**
   * Calculate prorated amount for upgrades
   */
  private async calculateProratedAmount(
    userId: string,
    previousPlan: string,
    newPlan: string,
    fullAmount: number
  ): Promise<number> {
    // Get current subscription details
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()
    
    if (!subscription) {
      return fullAmount
    }
    
    // Calculate remaining days
    const now = new Date()
    const endDate = new Date(subscription.ends_at)
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    
    // Calculate prorated amount
    const dailyRate = fullAmount / 30 // Assuming monthly billing
    const proratedAmount = Math.round(dailyRate * remainingDays)
    
    return Math.max(0, proratedAmount)
  }
  
  /**
   * Calculate credit amount for downgrades
   */
  private async calculateCreditAmount(
    userId: string,
    previousPlan: string,
    newPlan: string
  ): Promise<number> {
    // Similar logic to prorated calculation but for credits
    return 0 // Simplified for now
  }
  
  /**
   * Process Razorpay refund
   */
  private async processRazorpayRefund(invoice: InvoiceData): Promise<{success: boolean}> {
    // This would integrate with Razorpay refund API
    console.log('💰 Processing refund for invoice:', invoice.id)
    
    // Mock refund processing
    return { success: true }
  }
  
  /**
   * Send scenario-specific emails
   */
  private async sendScenarioEmails(
    scenario: PaymentScenario,
    invoice: InvoiceData,
    result: PaymentResult
  ) {
    try {
      if (result.success) {
        // Send invoice email
        await emailService.sendInvoiceEmail(invoice)
        
        // Send scenario-specific email
        switch (scenario.type) {
          case 'new_subscription':
            await this.sendWelcomeEmail(invoice)
            break
          case 'renewal':
            await this.sendRenewalEmail(invoice)
            break
          case 'upgrade':
            await this.sendUpgradeEmail(invoice)
            break
          case 'downgrade':
            await this.sendDowngradeEmail(invoice)
            break
        }
      } else {
        // Send failure email
        await emailService.sendPaymentFailureEmail(invoice, result.error || 'Payment failed')
      }
    } catch (error) {
      console.error('Error sending scenario emails:', error)
    }
  }
  
  /**
   * Send welcome email for new subscriptions
   */
  private async sendWelcomeEmail(invoice: InvoiceData) {
    console.log('📧 Sending welcome email to:', invoice.userEmail)
    // Implementation would send welcome email
  }
  
  /**
   * Send renewal email
   */
  private async sendRenewalEmail(invoice: InvoiceData) {
    console.log('📧 Sending renewal email to:', invoice.userEmail)
    // Implementation would send renewal email
  }
  
  /**
   * Send upgrade email
   */
  private async sendUpgradeEmail(invoice: InvoiceData) {
    console.log('📧 Sending upgrade email to:', invoice.userEmail)
    // Implementation would send upgrade email
  }
  
  /**
   * Send downgrade email
   */
  private async sendDowngradeEmail(invoice: InvoiceData) {
    console.log('📧 Sending downgrade email to:', invoice.userEmail)
    // Implementation would send downgrade email
  }
}

export const netflixPaymentService = new NetflixPaymentService()
