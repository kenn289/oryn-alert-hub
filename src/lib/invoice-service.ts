import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface InvoiceData {
  id: string
  userId: string
  userEmail: string
  userName: string
  plan: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  paymentMethod: string
  transactionId?: string
  createdAt: string
  dueDate: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export class InvoiceService {
  /**
   * Generate invoice for a payment
   */
  async generateInvoice(
    userId: string,
    userEmail: string,
    userName: string,
    plan: string,
    amount: number,
    currency: string = 'INR',
    paymentMethod: string = 'Razorpay'
  ): Promise<InvoiceData> {
    const invoiceId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    // Calculate pricing
    const subtotal = amount
    const tax = Math.round(amount * 0.18) // 18% GST
    const total = subtotal + tax
    
    // Create invoice items
    const items: InvoiceItem[] = [
      {
        description: `${plan.toUpperCase()} Subscription - Monthly`,
        quantity: 1,
        unitPrice: subtotal,
        total: subtotal
      }
    ]
    
    const invoice: InvoiceData = {
      id: invoiceId,
      userId,
      userEmail,
      userName,
      plan,
      amount: subtotal,
      currency,
      status: 'pending',
      paymentMethod,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      items,
      subtotal,
      tax,
      total
    }
    
    // Store invoice in database
    await this.storeInvoice(invoice)
    
    return invoice
  }
  
  /**
   * Store invoice in database
   */
  private async storeInvoice(invoice: InvoiceData) {
    const { error } = await supabase
      .from('invoices')
      .insert({
        id: invoice.id,
        user_id: invoice.userId,
        user_email: invoice.userEmail,
        user_name: invoice.userName,
        plan: invoice.plan,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        payment_method: invoice.paymentMethod,
        transaction_id: invoice.transactionId,
        created_at: invoice.createdAt,
        due_date: invoice.dueDate,
        items: JSON.stringify(invoice.items),
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total
      })
    
    if (error) {
      console.error('Error storing invoice:', error)
      throw new Error('Failed to store invoice')
    }
  }
  
  /**
   * Update invoice status
   */
  async updateInvoiceStatus(
    invoiceId: string,
    status: InvoiceData['status'],
    transactionId?: string
  ) {
    const { error } = await supabase
      .from('invoices')
      .update({
        status,
        transaction_id: transactionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
    
    if (error) {
      console.error('Error updating invoice status:', error)
      throw new Error('Failed to update invoice status')
    }
  }
  
  /**
   * Get user invoices
   */
  async getUserInvoices(userId: string): Promise<InvoiceData[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching invoices:', error)
      throw new Error('Failed to fetch invoices')
    }
    
    return data.map(this.mapDbInvoiceToInvoiceData)
  }
  
  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<InvoiceData | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()
    
    if (error) {
      console.error('Error fetching invoice:', error)
      return null
    }
    
    return this.mapDbInvoiceToInvoiceData(data)
  }
  
  /**
   * Map database invoice to InvoiceData
   */
  private mapDbInvoiceToInvoiceData(dbInvoice: any): InvoiceData {
    return {
      id: dbInvoice.id,
      userId: dbInvoice.user_id,
      userEmail: dbInvoice.user_email,
      userName: dbInvoice.user_name,
      plan: dbInvoice.plan,
      amount: dbInvoice.amount,
      currency: dbInvoice.currency,
      status: dbInvoice.status,
      paymentMethod: dbInvoice.payment_method,
      transactionId: dbInvoice.transaction_id,
      createdAt: dbInvoice.created_at,
      dueDate: dbInvoice.due_date,
      items: JSON.parse(dbInvoice.items || '[]'),
      subtotal: dbInvoice.subtotal,
      tax: dbInvoice.tax,
      total: dbInvoice.total
    }
  }
}

export const invoiceService = new InvoiceService()
