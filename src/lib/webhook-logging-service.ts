import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export interface WebhookEvent {
  id: string
  eventType: string
  eventId: string
  orderId?: string
  paymentId?: string
  userId?: string
  amount?: number
  currency?: string
  status: 'received' | 'processing' | 'completed' | 'failed'
  rawPayload: any
  processedAt?: string
  errorMessage?: string
  createdAt: string
}

export interface RevenueLog {
  id: string
  orderId: string
  paymentId: string
  userId: string
  amount: number
  currency: string
  plan: string
  status: 'pending' | 'confirmed' | 'failed' | 'refunded'
  source: 'webhook' | 'manual' | 'api'
  createdAt: string
  confirmedAt?: string
  errorMessage?: string
}

export class WebhookLoggingService {
  /**
   * Log webhook event
   */
  async logWebhookEvent(
    eventType: string,
    eventId: string,
    payload: any,
    orderId?: string,
    paymentId?: string,
    userId?: string,
    amount?: number,
    currency?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('webhook_events')
        .insert({
          event_type: eventType,
          event_id: eventId,
          order_id: orderId,
          payment_id: paymentId,
          user_id: userId,
          amount: amount,
          currency: currency,
          status: 'received',
          raw_payload: payload,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error

      console.log(`📝 Webhook event logged: ${eventType} (${eventId})`)
      return data.id

    } catch (error) {
      console.error('Error logging webhook event:', error)
      throw error
    }
  }

  /**
   * Update webhook event status
   */
  async updateWebhookEventStatus(
    eventId: string,
    status: WebhookEvent['status'],
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'completed' || status === 'failed') {
        updateData.processed_at = new Date().toISOString()
      }

      if (errorMessage) {
        updateData.error_message = errorMessage
      }

      const { error } = await supabase
        .from('webhook_events')
        .update(updateData)
        .eq('event_id', eventId)

      if (error) throw error

      console.log(`📝 Webhook event status updated: ${eventId} -> ${status}`)

    } catch (error) {
      console.error('Error updating webhook event status:', error)
      throw error
    }
  }

  /**
   * Log revenue transaction
   */
  async logRevenueTransaction(
    orderId: string,
    paymentId: string,
    userId: string,
    amount: number,
    currency: string,
    plan: string,
    source: RevenueLog['source'] = 'webhook'
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('revenue_logs')
        .insert({
          order_id: orderId,
          payment_id: paymentId,
          user_id: userId,
          amount: amount,
          currency: currency,
          plan: plan,
          status: 'pending',
          source: source,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error

      console.log(`💰 Revenue transaction logged: ${orderId} - ₹${amount}`)
      return data.id

    } catch (error) {
      console.error('Error logging revenue transaction:', error)
      throw error
    }
  }

  /**
   * Confirm revenue transaction
   */
  async confirmRevenueTransaction(
    orderId: string,
    paymentId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('revenue_logs')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .eq('payment_id', paymentId)

      if (error) throw error

      console.log(`✅ Revenue transaction confirmed: ${orderId}`)

    } catch (error) {
      console.error('Error confirming revenue transaction:', error)
      throw error
    }
  }

  /**
   * Mark revenue transaction as failed
   */
  async markRevenueTransactionFailed(
    orderId: string,
    errorMessage: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('revenue_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId)

      if (error) throw error

      console.log(`❌ Revenue transaction failed: ${orderId} - ${errorMessage}`)

    } catch (error) {
      console.error('Error marking revenue transaction as failed:', error)
      throw error
    }
  }

  /**
   * Get webhook events for debugging
   */
  async getWebhookEvents(
    limit: number = 50,
    eventType?: string,
    status?: string
  ): Promise<WebhookEvent[]> {
    try {
      let query = supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (eventType) {
        query = query.eq('event_type', eventType)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      return data.map(event => ({
        id: event.id,
        eventType: event.event_type,
        eventId: event.event_id,
        orderId: event.order_id,
        paymentId: event.payment_id,
        userId: event.user_id,
        amount: event.amount,
        currency: event.currency,
        status: event.status,
        rawPayload: event.raw_payload,
        processedAt: event.processed_at,
        errorMessage: event.error_message,
        createdAt: event.created_at
      }))

    } catch (error) {
      console.error('Error fetching webhook events:', error)
      return []
    }
  }

  /**
   * Get revenue logs for debugging
   */
  async getRevenueLogs(
    limit: number = 50,
    status?: string,
    source?: string
  ): Promise<RevenueLog[]> {
    try {
      let query = supabase
        .from('revenue_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      if (source) {
        query = query.eq('source', source)
      }

      const { data, error } = await query

      if (error) throw error

      return data.map(log => ({
        id: log.id,
        orderId: log.order_id,
        paymentId: log.payment_id,
        userId: log.user_id,
        amount: log.amount,
        currency: log.currency,
        plan: log.plan,
        status: log.status,
        source: log.source,
        createdAt: log.created_at,
        confirmedAt: log.confirmed_at,
        errorMessage: log.error_message
      }))

    } catch (error) {
      console.error('Error fetching revenue logs:', error)
      return []
    }
  }

  /**
   * Get revenue summary
   */
  async getRevenueSummary(): Promise<{
    totalRevenue: number
    confirmedRevenue: number
    pendingRevenue: number
    failedRevenue: number
    totalTransactions: number
    confirmedTransactions: number
    pendingTransactions: number
    failedTransactions: number
  }> {
    try {
      const { data: logs, error } = await supabase
        .from('revenue_logs')
        .select('amount, status')

      if (error) throw error

      const totalRevenue = logs?.reduce((sum, log) => sum + (log.amount || 0), 0) || 0
      const confirmedRevenue = logs?.filter(log => log.status === 'confirmed').reduce((sum, log) => sum + (log.amount || 0), 0) || 0
      const pendingRevenue = logs?.filter(log => log.status === 'pending').reduce((sum, log) => sum + (log.amount || 0), 0) || 0
      const failedRevenue = logs?.filter(log => log.status === 'failed').reduce((sum, log) => sum + (log.amount || 0), 0) || 0

      const totalTransactions = logs?.length || 0
      const confirmedTransactions = logs?.filter(log => log.status === 'confirmed').length || 0
      const pendingTransactions = logs?.filter(log => log.status === 'pending').length || 0
      const failedTransactions = logs?.filter(log => log.status === 'failed').length || 0

      return {
        totalRevenue,
        confirmedRevenue,
        pendingRevenue,
        failedRevenue,
        totalTransactions,
        confirmedTransactions,
        pendingTransactions,
        failedTransactions
      }

    } catch (error) {
      console.error('Error getting revenue summary:', error)
      return {
        totalRevenue: 0,
        confirmedRevenue: 0,
        pendingRevenue: 0,
        failedRevenue: 0,
        totalTransactions: 0,
        confirmedTransactions: 0,
        pendingTransactions: 0,
        failedTransactions: 0
      }
    }
  }

  /**
   * Process webhook event with comprehensive logging
   */
  async processWebhookEvent(
    eventType: string,
    eventId: string,
    payload: any,
    orderId?: string,
    paymentId?: string,
    userId?: string,
    amount?: number,
    currency?: string
  ): Promise<boolean> {
    let webhookEventId: string | null = null

    try {
      // Log webhook event
      webhookEventId = await this.logWebhookEvent(
        eventType,
        eventId,
        payload,
        orderId,
        paymentId,
        userId,
        amount,
        currency
      )

      // Update status to processing
      await this.updateWebhookEventStatus(webhookEventId, 'processing')

      // Log revenue transaction if it's a payment event
      if (eventType === 'payment.captured' && orderId && paymentId && userId && amount) {
        await this.logRevenueTransaction(
          orderId,
          paymentId,
          userId,
          amount,
          currency || 'INR',
          payload.notes?.plan || 'pro',
          'webhook'
        )
      }

      // Update status to completed
      await this.updateWebhookEventStatus(webhookEventId, 'completed')

      console.log(`✅ Webhook event processed successfully: ${eventType} (${eventId})`)
      return true

    } catch (error) {
      console.error(`❌ Error processing webhook event: ${eventType} (${eventId})`, error)
      
      if (webhookEventId) {
        await this.updateWebhookEventStatus(
          webhookEventId,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        )
      }

      return false
    }
  }
}

export const webhookLoggingService = new WebhookLoggingService()
