"use client"

export interface SupportTicket {
  id: string
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general'
  createdAt: string
  updatedAt: string
  userId: string
  userEmail: string
  assignedTo?: string
  resolution?: string
  responseTime?: number // in minutes
  rating?: number // 1-5 stars
  attachments?: string[]
}

export interface SupportStats {
  openTickets: number
  resolvedThisMonth: number
  averageResponseTime: number
  customerRating: number
  totalTickets: number
}

class SupportService {
  private baseUrl = '/api/support'

  async createTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<SupportTicket> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticket),
      })

      if (!response.ok) {
        throw new Error('Failed to create support ticket')
      }

      const newTicket = await response.json()
      
      // Send email notification
      await this.sendEmailNotification(newTicket, 'ticket_created')
      
      return newTicket
    } catch (error) {
      console.error('Error creating support ticket:', error)
      throw error
    }
  }

  async getTickets(userId: string): Promise<SupportTicket[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets?userId=${userId}`)
      
      if (!response.ok) {
        console.error('Support tickets API failed:', response.status, response.statusText)
        // Return empty array instead of throwing error
        return []
      }

      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching support tickets:', error)
      // Return empty array instead of throwing error
      return []
    }
  }

  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/${ticketId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch support ticket')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching support ticket:', error)
      return null
    }
  }

  async updateTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update support ticket')
      }

      const updatedTicket = await response.json()
      
      // Send email notification if status changed
      if (updates.status && updates.status !== 'open') {
        await this.sendEmailNotification(updatedTicket, 'ticket_updated')
      }
      
      return updatedTicket
    } catch (error) {
      console.error('Error updating support ticket:', error)
      throw error
    }
  }

  async getStats(): Promise<SupportStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        console.warn('Support stats API failed:', response.status, response.statusText)
        // Return default stats instead of throwing error
        return {
          openTickets: 0,
          resolvedThisMonth: 0,
          averageResponseTime: 0,
          customerRating: 0,
          totalTickets: 0
        }
      }

      const data = await response.json()
      console.log('✅ Support stats loaded successfully:', data)
      return data
    } catch (error) {
      console.warn('Error fetching support stats:', error)
      return {
        openTickets: 0,
        resolvedThisMonth: 0,
        averageResponseTime: 0,
        customerRating: 0,
        totalTickets: 0
      }
    }
  }

  async rateTicket(ticketId: string, rating: number, feedback?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ticketId, 
          rating, 
          feedback 
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to rate ticket')
      }
    } catch (error) {
      console.error('Error rating support ticket:', error)
      throw error
    }
  }

  private async sendEmailNotification(ticket: SupportTicket, type: 'ticket_created' | 'ticket_updated'): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket,
          type,
          recipientEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@oryn.com'
        }),
      })
    } catch (error) {
      console.error('Error sending email notification:', error)
    }
  }

  // Auto-refresh tickets every 30 seconds
  startAutoRefresh(callback: (tickets: SupportTicket[]) => void, userId: string): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        const tickets = await this.getTickets(userId)
        callback(tickets)
      } catch (error) {
        console.error('Error in auto-refresh:', error)
      }
    }, 30000) // 30 seconds
  }

  stopAutoRefresh(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId)
  }
}

export const supportService = new SupportService()
