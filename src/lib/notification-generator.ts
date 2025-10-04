// Notification generator for real-time updates
export interface NotificationData {
  id: string
  type: 'ticket_created' | 'ticket_resolved' | 'user_plan_changed' | 'system_alert'
  title: string
  message: string
  user_id: string
  created_at: string
  read: boolean
}

export class NotificationGenerator {
  // Generate notification for ticket creation
  static generateTicketCreated(ticket: any, userId: string): NotificationData {
    return {
      id: `ticket_${ticket.id}_${Date.now()}`,
      type: 'ticket_created',
      title: 'New Support Ticket',
      message: `A new support ticket "${ticket.subject}" has been created`,
      user_id: userId,
      created_at: new Date().toISOString(),
      read: false
    }
  }

  // Generate notification for ticket resolution
  static generateTicketResolved(ticket: any, userId: string): NotificationData {
    return {
      id: `ticket_resolved_${ticket.id}_${Date.now()}`,
      type: 'ticket_resolved',
      title: 'Ticket Resolved',
      message: `Your support ticket "${ticket.subject}" has been resolved`,
      user_id: userId,
      created_at: new Date().toISOString(),
      read: false
    }
  }

  // Generate notification for user plan change
  static generatePlanChanged(userEmail: string, newPlan: string, userId: string): NotificationData {
    return {
      id: `plan_changed_${userId}_${Date.now()}`,
      type: 'user_plan_changed',
      title: 'Plan Updated',
      message: `Your plan has been updated to ${newPlan.toUpperCase()}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      read: false
    }
  }

  // Generate system alert
  static generateSystemAlert(title: string, message: string, userId: string): NotificationData {
    return {
      id: `system_${Date.now()}`,
      type: 'system_alert',
      title,
      message,
      user_id: userId,
      created_at: new Date().toISOString(),
      read: false
    }
  }
}
