// Simple notification service that works without API dependencies
export interface SimpleNotification {
  id: string
  type: 'ticket_created' | 'ticket_resolved' | 'user_joined' | 'alert_triggered' | 'plan_updated'
  title: string
  message: string
  read: boolean
  created_at: string
}

export class SimpleNotificationService {
  private notifications: SimpleNotification[] = [
    {
      id: '1',
      type: 'ticket_created',
      title: 'New Support Ticket',
      message: 'A new support ticket has been created',
      read: false,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      type: 'alert_triggered',
      title: 'Stock Alert Triggered',
      message: 'Your AAPL alert has been triggered',
      read: true,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '3',
      type: 'plan_updated',
      title: 'Plan Updated',
      message: 'Your plan has been upgraded to Pro',
      read: false,
      created_at: new Date(Date.now() - 1800000).toISOString()
    }
  ]

  // Get notifications (simulated)
  async getNotifications(userId: string): Promise<SimpleNotification[]> {
    // Always return stored notifications (empty array if cleared)
    console.log('📬 Getting notifications for user:', userId, 'Count:', this.notifications.length)
    return this.notifications
  }

  // Mark notification as read (simulated)
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  // Mark all notifications as read (simulated)
  async markAllAsRead(userId: string): Promise<void> {
    this.notifications.forEach(n => n.read = true)
  }

  // Clear all notifications (simulated)
  async clearAllNotifications(userId: string): Promise<void> {
    this.notifications = []
    console.log('🗑️ Cleared all notifications for user:', userId)
  }

  // Create notification (simulated)
  async createNotification(notification: Omit<SimpleNotification, 'id' | 'created_at'>): Promise<SimpleNotification> {
    const newNotification: SimpleNotification = {
      ...notification,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    this.notifications.push(newNotification)
    return newNotification
  }
}

export const simpleNotificationService = new SimpleNotificationService()
