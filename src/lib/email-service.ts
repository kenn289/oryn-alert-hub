// Email notification service for alerts and portfolio changes
export interface EmailNotification {
  id: string
  userId: string
  userEmail: string
  type: 'price_alert' | 'portfolio_change' | 'watchlist_alert' | 'options_flow' | 'insider_trading'
  subject: string
  content: string
  priority: 'low' | 'medium' | 'high'
  sent: boolean
  sentAt?: string
  createdAt: string
  data: Record<string, unknown>
}

export interface PriceAlert {
  ticker: string
  currentPrice: number
  targetPrice: number
  change: number
  changePercent: number
  condition: 'above' | 'below'
  triggered: boolean
}

export interface PortfolioChange {
  ticker: string
  shares: number
  oldPrice: number
  newPrice: number
  valueChange: number
  valueChangePercent: number
  totalValue: number
}

export interface WatchlistAlert {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  alertType: 'price' | 'volume' | 'news'
}

class EmailService {
  private notifications: EmailNotification[] = []

  // Load notifications from localStorage
  private loadNotifications() {
    const stored = localStorage.getItem('oryn_email_notifications')
    if (stored) {
      this.notifications = JSON.parse(stored)
    }
  }

  // Save notifications to localStorage
  private saveNotifications() {
    localStorage.setItem('oryn_email_notifications', JSON.stringify(this.notifications))
  }

  // Create price alert notification
  createPriceAlert(userId: string, userEmail: string, alert: PriceAlert): EmailNotification {
    const notification: EmailNotification = {
      id: `price_alert_${Date.now()}`,
      userId,
      userEmail,
      type: 'price_alert',
      subject: `🚨 Price Alert: ${alert.ticker} ${alert.condition} $${alert.targetPrice}`,
      content: this.generatePriceAlertContent(alert),
      priority: Math.abs(alert.changePercent) > 10 ? 'high' : 'medium',
      sent: false,
      createdAt: new Date().toISOString(),
      data: alert as unknown as Record<string, unknown> as unknown as Record<string, unknown>
    }

    this.notifications.push(notification)
    this.saveNotifications()
    return notification
  }

  // Create portfolio change notification
  createPortfolioChange(userId: string, userEmail: string, change: PortfolioChange): EmailNotification {
    const notification: EmailNotification = {
      id: `portfolio_change_${Date.now()}`,
      userId,
      userEmail,
      type: 'portfolio_change',
      subject: `📊 Portfolio Update: ${change.ticker} ${change.valueChange >= 0 ? 'gained' : 'lost'} ${Math.abs(change.valueChangePercent).toFixed(1)}%`,
      content: this.generatePortfolioChangeContent(change),
      priority: Math.abs(change.valueChangePercent) > 5 ? 'high' : 'medium',
      sent: false,
      createdAt: new Date().toISOString(),
      data: change as unknown as Record<string, unknown>
    }

    this.notifications.push(notification)
    this.saveNotifications()
    return notification
  }

  // Create watchlist alert notification
  createWatchlistAlert(userId: string, userEmail: string, alert: WatchlistAlert): EmailNotification {
    const notification: EmailNotification = {
      id: `watchlist_alert_${Date.now()}`,
      userId,
      userEmail,
      type: 'watchlist_alert',
      subject: `👀 Watchlist Alert: ${alert.ticker} ${alert.alertType} activity`,
      content: this.generateWatchlistAlertContent(alert),
      priority: 'medium',
      sent: false,
      createdAt: new Date().toISOString(),
      data: alert as unknown as Record<string, unknown>
    }

    this.notifications.push(notification)
    this.saveNotifications()
    return notification
  }

  // Create options flow notification
  createOptionsFlowAlert(userId: string, userEmail: string, data: Record<string, unknown>): EmailNotification {
    const notification: EmailNotification = {
      id: `options_flow_${Date.now()}`,
      userId,
      userEmail,
      type: 'options_flow',
      subject: `💰 Options Flow: Unusual activity in ${(data.ticker as string)}`,
      content: this.generateOptionsFlowContent(data),
      priority: 'high',
      sent: false,
      createdAt: new Date().toISOString(),
      data
    }

    this.notifications.push(notification)
    this.saveNotifications()
    return notification
  }

  // Create insider trading notification
  createInsiderTradingAlert(userId: string, userEmail: string, data: Record<string, unknown>): EmailNotification {
    const notification: EmailNotification = {
      id: `insider_trading_${Date.now()}`,
      userId,
      userEmail,
      type: 'insider_trading',
      subject: `👤 Insider Trading: ${(data.company as string)} ${(data.type as string)} activity`,
      content: this.generateInsiderTradingContent(data),
      priority: 'medium',
      sent: false,
      createdAt: new Date().toISOString(),
      data
    }

    this.notifications.push(notification)
    this.saveNotifications()
    return notification
  }

  // Generate email content for price alerts
  private generatePriceAlertContent(alert: PriceAlert): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">🚨 Price Alert Triggered</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1a1a1a;">${alert.ticker}</h3>
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: ${alert.change >= 0 ? '#10b981' : '#ef4444'};">
            $${alert.currentPrice.toFixed(2)} 
            <span style="color: ${alert.change >= 0 ? '#10b981' : '#ef4444'};">
              (${alert.change >= 0 ? '+' : ''}${alert.change.toFixed(2)} ${alert.change >= 0 ? '+' : ''}${alert.changePercent.toFixed(2)}%)
            </span>
          </p>
          <p style="margin: 5px 0; color: #6b7280;">
            Alert triggered: Price ${alert.condition} $${alert.targetPrice}
          </p>
        </div>

        <div style="background: #e5e7eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #374151;">
            <strong>Alert Details:</strong><br>
            • Target Price: $${alert.targetPrice}<br>
            • Current Price: $${alert.currentPrice.toFixed(2)}<br>
            • Change: ${alert.change >= 0 ? '+' : ''}${alert.change.toFixed(2)} (${alert.change >= 0 ? '+' : ''}${alert.changePercent.toFixed(2)}%)<br>
            • Condition: ${alert.condition === 'above' ? 'Above' : 'Below'} target
          </p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          This alert was triggered at ${new Date().toLocaleString()}. 
          You can manage your alerts in your Oryn dashboard.
        </p>
      </div>
    `
  }

  // Generate email content for portfolio changes
  private generatePortfolioChangeContent(change: PortfolioChange): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">📊 Portfolio Update</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1a1a1a;">${change.ticker}</h3>
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: ${change.valueChange >= 0 ? '#10b981' : '#ef4444'};">
            $${change.newPrice.toFixed(2)} 
            <span style="color: ${change.valueChange >= 0 ? '#10b981' : '#ef4444'};">
              (${change.valueChange >= 0 ? '+' : ''}${change.valueChange.toFixed(2)} ${change.valueChange >= 0 ? '+' : ''}${change.valueChangePercent.toFixed(2)}%)
            </span>
          </p>
          <p style="margin: 5px 0; color: #6b7280;">
            Total Value: $${change.totalValue.toFixed(2)}
          </p>
        </div>

        <div style="background: #e5e7eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #374151;">
            <strong>Portfolio Details:</strong><br>
            • Shares: ${change.shares}<br>
            • Previous Price: $${change.oldPrice.toFixed(2)}<br>
            • Current Price: $${change.newPrice.toFixed(2)}<br>
            • Value Change: ${change.valueChange >= 0 ? '+' : ''}$${change.valueChange.toFixed(2)}<br>
            • Change %: ${change.valueChange >= 0 ? '+' : ''}${change.valueChangePercent.toFixed(2)}%
          </p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          Portfolio updated at ${new Date().toLocaleString()}. 
          View your full portfolio in your Oryn dashboard.
        </p>
      </div>
    `
  }

  // Generate email content for watchlist alerts
  private generateWatchlistAlertContent(alert: WatchlistAlert): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">👀 Watchlist Alert</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1a1a1a;">${alert.ticker} - ${alert.name}</h3>
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: ${alert.change >= 0 ? '#10b981' : '#ef4444'};">
            $${alert.price.toFixed(2)} 
            <span style="color: ${alert.change >= 0 ? '#10b981' : '#ef4444'};">
              (${alert.change >= 0 ? '+' : ''}${alert.change.toFixed(2)} ${alert.change >= 0 ? '+' : ''}${alert.changePercent.toFixed(2)}%)
            </span>
          </p>
          <p style="margin: 5px 0; color: #6b7280;">
            Volume: ${alert.volume.toLocaleString()} shares
          </p>
        </div>

        <div style="background: #e5e7eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #374151;">
            <strong>Alert Type:</strong> ${alert.alertType.charAt(0).toUpperCase() + alert.alertType.slice(1)} Activity<br>
            <strong>Current Price:</strong> $${alert.price.toFixed(2)}<br>
            <strong>Change:</strong> ${alert.change >= 0 ? '+' : ''}${alert.change.toFixed(2)} (${alert.change >= 0 ? '+' : ''}${alert.changePercent.toFixed(2)}%)<br>
            <strong>Volume:</strong> ${alert.volume.toLocaleString()} shares
          </p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          This alert was triggered at ${new Date().toLocaleString()}. 
          Manage your watchlist alerts in your Oryn dashboard.
        </p>
      </div>
    `
  }

  // Generate email content for options flow
  private generateOptionsFlowContent(data: Record<string, unknown>): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">💰 Options Flow Alert</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1a1a1a;">${(data.ticker as string)}</h3>
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #1a1a1a;">
            Unusual Options Activity Detected
          </p>
          <p style="margin: 5px 0; color: #6b7280;">
            ${(data.type as string)} • ${(data.size as number)} contracts • $${(data.premium as number).toLocaleString()} premium
          </p>
        </div>

        <div style="background: #e5e7eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #374151;">
            <strong>Activity Details:</strong><br>
            • Ticker: ${(data.ticker as string)}<br>
            • Type: ${(data.type as string)}<br>
            • Contracts: ${(data.size as number).toLocaleString()}<br>
            • Premium: $${(data.premium as number).toLocaleString()}<br>
            • Sentiment: ${(data.sentiment as string) || 'Neutral'}
          </p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          Unusual options activity detected at ${new Date().toLocaleString()}. 
          View detailed options flow in your Oryn dashboard.
        </p>
      </div>
    `
  }

  // Generate email content for insider trading
  private generateInsiderTradingContent(data: Record<string, unknown>): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">👤 Insider Trading Alert</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1a1a1a;">${(data.company as string)}</h3>
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: ${(data.type as string) === 'Buy' ? '#10b981' : '#ef4444'};">
            ${(data.insider as string)} ${(data.type as string)} Activity
          </p>
          <p style="margin: 5px 0; color: #6b7280;">
            ${(data.shares as number).toLocaleString()} shares • ${(data.date as string)}
          </p>
        </div>

        <div style="background: #e5e7eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #374151;">
            <strong>Insider Activity:</strong><br>
            • Company: ${(data.company as string)}<br>
            • Insider: ${(data.insider as string)}<br>
            • Type: ${(data.type as string)}<br>
            • Shares: ${(data.shares as number).toLocaleString()}<br>
            • Date: ${(data.date as string)}
          </p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          Insider trading activity reported at ${new Date().toLocaleString()}. 
          View all insider trading data in your Oryn dashboard.
        </p>
      </div>
    `
  }

  // Send email notification (simulate email sending)
  async sendNotification(notification: EmailNotification): Promise<boolean> {
    try {
      // In a real implementation, this would call an email service like SendGrid, AWS SES, etc.
      console.log('Sending email notification:', {
        to: notification.userEmail,
        subject: notification.subject,
        type: notification.type
      })

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mark as sent
      notification.sent = true
      notification.sentAt = new Date().toISOString()
      this.saveNotifications()

      return true
    } catch (error) {
      console.error('Error sending email notification:', error)
      return false
    }
  }

  // Send all pending notifications
  async sendPendingNotifications(): Promise<void> {
    this.loadNotifications()
    const pending = this.notifications.filter(n => !n.sent)
    
    for (const notification of pending) {
      await this.sendNotification(notification)
    }
  }

  // Get notifications for a user
  getUserNotifications(userId: string): EmailNotification[] {
    this.loadNotifications()
    return this.notifications.filter(n => n.userId === userId)
  }

  // Get pending notifications for a user
  getPendingNotifications(userId: string): EmailNotification[] {
    this.loadNotifications()
    return this.notifications.filter(n => n.userId === userId && !n.sent)
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    this.loadNotifications()
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.sent = true
      notification.sentAt = new Date().toISOString()
      this.saveNotifications()
    }
  }

  // Delete notification
  deleteNotification(notificationId: string): void {
    this.loadNotifications()
    this.notifications = this.notifications.filter(n => n.id !== notificationId)
    this.saveNotifications()
  }
}

export const emailService = new EmailService()

// Auto-send notifications every 5 minutes
setInterval(() => {
  emailService.sendPendingNotifications()
}, 5 * 60 * 1000)
