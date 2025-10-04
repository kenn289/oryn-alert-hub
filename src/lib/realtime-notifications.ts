// Real-time notification system
export interface RealtimeNotification {
  id: string
  type: 'ticket_updated' | 'user_plan_changed' | 'system_alert'
  title: string
  message: string
  timestamp: Date
  data?: any
}

class RealtimeNotificationService {
  private listeners: Set<(notification: RealtimeNotification) => void> = new Set()

  // Subscribe to notifications
  subscribe(callback: (notification: RealtimeNotification) => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // Send notification
  sendNotification(notification: Omit<RealtimeNotification, 'id' | 'timestamp'>) {
    const fullNotification: RealtimeNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    }

    this.listeners.forEach(callback => callback(fullNotification))
  }

  // Send ticket update notification
  sendTicketUpdate(ticketId: string, status: string, userEmail: string) {
    this.sendNotification({
      type: 'ticket_updated',
      title: 'Ticket Updated',
      message: `Ticket ${ticketId} status changed to ${status} for ${userEmail}`,
      data: { ticketId, status, userEmail }
    })
  }

  // Send user plan change notification
  sendUserPlanChange(userEmail: string, newPlan: string) {
    this.sendNotification({
      type: 'user_plan_changed',
      title: 'User Plan Updated',
      message: `${userEmail} plan changed to ${newPlan}`,
      data: { userEmail, newPlan }
    })
  }

  // Broadcast notification to all users
  async broadcastNotification(title: string, message: string, type: string = 'info') {
    this.sendNotification({
      type: 'system_alert',
      title,
      message,
      data: { broadcast: true, type }
    })
  }
}

export const realtimeNotificationService = new RealtimeNotificationService()
