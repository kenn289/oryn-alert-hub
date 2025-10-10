import { createClient } from '@supabase/supabase-js'
import { InvoiceData } from './invoice-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  /**
   * Send invoice email to user
   */
  async sendInvoiceEmail(invoice: InvoiceData): Promise<boolean> {
    try {
      const template = this.generateInvoiceEmailTemplate(invoice)
      
      // Store email in database for tracking
      await this.logEmail({
        to: invoice.userEmail,
        subject: template.subject,
        type: 'invoice',
        invoiceId: invoice.id,
        status: 'sent'
      })
      
      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      console.log('📧 Invoice email would be sent to:', invoice.userEmail)
      console.log('📧 Subject:', template.subject)
      console.log('📧 Invoice ID:', invoice.id)
      
      return true
    } catch (error) {
      console.error('Error sending invoice email:', error)
      return false
    }
  }
  
  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(invoice: InvoiceData): Promise<boolean> {
    try {
      const template = this.generatePaymentConfirmationTemplate(invoice)
      
      await this.logEmail({
        to: invoice.userEmail,
        subject: template.subject,
        type: 'payment_confirmation',
        invoiceId: invoice.id,
        status: 'sent'
      })
      
      console.log('📧 Payment confirmation email would be sent to:', invoice.userEmail)
      console.log('📧 Subject:', template.subject)
      
      return true
    } catch (error) {
      console.error('Error sending payment confirmation email:', error)
      return false
    }
  }
  
  /**
   * Send payment failure email
   */
  async sendPaymentFailureEmail(invoice: InvoiceData, reason: string): Promise<boolean> {
    try {
      const template = this.generatePaymentFailureTemplate(invoice, reason)
      
      await this.logEmail({
        to: invoice.userEmail,
        subject: template.subject,
        type: 'payment_failure',
        invoiceId: invoice.id,
        status: 'sent'
      })
      
      console.log('📧 Payment failure email would be sent to:', invoice.userEmail)
      console.log('📧 Subject:', template.subject)
      
      return true
    } catch (error) {
      console.error('Error sending payment failure email:', error)
      return false
    }
  }
  
  /**
   * Generate invoice email template
   */
  private generateInvoiceEmailTemplate(invoice: InvoiceData): EmailTemplate {
    const subject = `Invoice ${invoice.id} - ${invoice.plan.toUpperCase()} Subscription`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .invoice-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; color: #8B5CF6; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .button { background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice ${invoice.id}</h1>
            <p>Thank you for your subscription to Oryn Pro!</p>
          </div>
          
          <div class="content">
            <h2>Invoice Details</h2>
            <div class="invoice-details">
              <p><strong>Invoice ID:</strong> ${invoice.id}</p>
              <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              <p><strong>Plan:</strong> ${invoice.plan.toUpperCase()}</p>
              
              <h3>Items</h3>
              ${invoice.items.map(item => `
                <div class="item">
                  <span>${item.description}</span>
                  <span>${invoice.currency} ${item.total}</span>
                </div>
              `).join('')}
              
              <div class="item">
                <span>Subtotal</span>
                <span>${invoice.currency} ${invoice.subtotal}</span>
              </div>
              <div class="item">
                <span>Tax (18%)</span>
                <span>${invoice.currency} ${invoice.tax}</span>
              </div>
              <div class="item total">
                <span>Total</span>
                <span>${invoice.currency} ${invoice.total}</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" class="button">
                Access Your Dashboard
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Oryn!</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const text = `
      Invoice ${invoice.id}
      
      Thank you for your subscription to Oryn Pro!
      
      Invoice Details:
      - Invoice ID: ${invoice.id}
      - Date: ${new Date(invoice.createdAt).toLocaleDateString()}
      - Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
      - Plan: ${invoice.plan.toUpperCase()}
      
      Items:
      ${invoice.items.map(item => `- ${item.description}: ${invoice.currency} ${item.total}`).join('\n')}
      
      Subtotal: ${invoice.currency} ${invoice.subtotal}
      Tax (18%): ${invoice.currency} ${invoice.tax}
      Total: ${invoice.currency} ${invoice.total}
      
      Access your dashboard: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard
      
      Thank you for choosing Oryn!
    `
    
    return { subject, html, text }
  }
  
  /**
   * Generate payment confirmation email template
   */
  private generatePaymentConfirmationTemplate(invoice: InvoiceData): EmailTemplate {
    const subject = `Payment Confirmed - Invoice ${invoice.id}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success { background: #D1FAE5; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Confirmed!</h1>
          </div>
          
          <div class="content">
            <div class="success">
              <h2>Your payment has been successfully processed!</h2>
              <p><strong>Invoice ID:</strong> ${invoice.id}</p>
              <p><strong>Amount:</strong> ${invoice.currency} ${invoice.total}</p>
              <p><strong>Plan:</strong> ${invoice.plan.toUpperCase()}</p>
            </div>
            
            <p>You now have access to all Pro features. Welcome to Oryn Pro!</p>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    
    const text = `
      Payment Confirmed!
      
      Your payment has been successfully processed!
      
      Invoice ID: ${invoice.id}
      Amount: ${invoice.currency} ${invoice.total}
      Plan: ${invoice.plan.toUpperCase()}
      
      You now have access to all Pro features. Welcome to Oryn Pro!
      
      Access your dashboard: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard
    `
    
    return { subject, html, text }
  }
  
  /**
   * Generate payment failure email template
   */
  private generatePaymentFailureTemplate(invoice: InvoiceData, reason: string): EmailTemplate {
    const subject = `Payment Failed - Invoice ${invoice.id}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Failed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .error { background: #FEE2E2; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Payment Failed</h1>
          </div>
          
          <div class="content">
            <div class="error">
              <h2>Your payment could not be processed</h2>
              <p><strong>Invoice ID:</strong> ${invoice.id}</p>
              <p><strong>Amount:</strong> ${invoice.currency} ${invoice.total}</p>
              <p><strong>Reason:</strong> ${reason}</p>
            </div>
            
            <p>Please try again or contact our support team if the issue persists.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/pricing" style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Try Again
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    
    const text = `
      Payment Failed
      
      Your payment could not be processed.
      
      Invoice ID: ${invoice.id}
      Amount: ${invoice.currency} ${invoice.total}
      Reason: ${reason}
      
      Please try again or contact our support team if the issue persists.
      
      Try again: ${process.env.NEXT_PUBLIC_BASE_URL}/pricing
    `
    
    return { subject, html, text }
  }
  
  /**
   * Log email in database
   */
  private async logEmail(emailData: {
    to: string
    subject: string
    type: string
    invoiceId: string
    status: string
  }) {
    const { error } = await supabase
      .from('email_logs')
      .insert({
        to_email: emailData.to,
        subject: emailData.subject,
        email_type: emailData.type,
        invoice_id: emailData.invoiceId,
        status: emailData.status,
        sent_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error logging email:', error)
    }
  }
}

export const emailService = new EmailService()