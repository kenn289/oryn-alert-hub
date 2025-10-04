import nodemailer from 'nodemailer'

// Email service for support tickets
export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // Gmail SMTP configuration
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    })
  }

  // Send ticket notification to admin
  async sendTicketNotification(ticket: any) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'your-email@domain.com'
      
      const mailOptions = {
        from: process.env.SMTP_USER || 'your-email@gmail.com',
        to: adminEmail,
        subject: `🚨 New Support Ticket: ${ticket.subject}`,
        html: this.generateTicketEmail(ticket)
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('✅ Email sent successfully:', result.messageId)
      return result
    } catch (error) {
      console.error('❌ Email sending failed:', error)
      throw error
    }
  }

  // Send ticket update notification to user
  async sendTicketUpdate(ticket: any, updateType: string) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'your-email@gmail.com',
        to: ticket.user_email,
        subject: `📧 Support Ticket Update: ${ticket.subject}`,
        html: this.generateUpdateEmail(ticket, updateType)
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('✅ Update email sent successfully:', result.messageId)
      return result
    } catch (error) {
      console.error('❌ Update email sending failed:', error)
      throw error
    }
  }

  // Generate HTML email for new tickets
  private generateTicketEmail(ticket: any) {
    const priorityColor = this.getPriorityColor(ticket.priority)
    const statusColor = this.getStatusColor(ticket.status)
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #00d4aa, #00a8cc); padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚨 New Support Ticket</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Priority: ${ticket.priority.toUpperCase()}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="margin-top: 0; color: #333; border-bottom: 2px solid #00d4aa; padding-bottom: 10px;">Ticket Details</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #666;">Ticket ID:</td>
              <td style="padding: 8px 0; font-family: monospace; background: #f8f9fa; padding: 8px; border-radius: 4px;">${ticket.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Subject:</td>
              <td style="padding: 8px 0; font-weight: 500;">${ticket.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Priority:</td>
              <td style="padding: 8px 0;">
                <span style="background: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  ${ticket.priority.toUpperCase()}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Status:</td>
              <td style="padding: 8px 0;">
                <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  ${ticket.status.toUpperCase()}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">User:</td>
              <td style="padding: 8px 0;">${ticket.user_email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Created:</td>
              <td style="padding: 8px 0;">${new Date(ticket.created_at).toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; color: #333; border-bottom: 2px solid #00d4aa; padding-bottom: 10px;">Description</h3>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #00d4aa;">
            <p style="white-space: pre-wrap; line-height: 1.6; margin: 0; color: #555;">${ticket.description}</p>
          </div>
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border: 1px solid #2196f3; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #1976d2;">🎯 Quick Actions</h3>
          <p style="margin: 10px 0; color: #555;">You can manage this ticket by:</p>
          <ul style="margin: 10px 0; color: #555;">
            <li>Replying to this email to update the ticket</li>
            <li>Visiting the admin dashboard</li>
            <li>Updating the status directly in the database</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #00d4aa; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            🚀 View Dashboard
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
          <p>This is an automated notification from Oryn Support System</p>
          <p>Reply to this email to update the ticket status</p>
        </div>
      </div>
    `
  }

  // Generate HTML email for ticket updates
  private generateUpdateEmail(ticket: any, updateType: string) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #4caf50, #2e7d32); padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📧 Ticket Update</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">${updateType}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="margin-top: 0; color: #333;">Your ticket has been updated</h2>
          <p style="color: #666;">Ticket: <strong>${ticket.subject}</strong></p>
          <p style="color: #666;">Status: <strong>${ticket.status.toUpperCase()}</strong></p>
          ${ticket.resolution ? `<p style="color: #666;">Resolution: <strong>${ticket.resolution}</strong></p>` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View Ticket
          </a>
        </div>
      </div>
    `
  }

  private getPriorityColor(priority: string) {
    switch (priority) {
      case 'urgent': return '#f44336'
      case 'high': return '#ff9800'
      case 'medium': return '#2196f3'
      case 'low': return '#4caf50'
      default: return '#9e9e9e'
    }
  }

  private getStatusColor(status: string) {
    switch (status) {
      case 'open': return '#f44336'
      case 'in_progress': return '#ff9800'
      case 'resolved': return '#4caf50'
      case 'closed': return '#9e9e9e'
      default: return '#9e9e9e'
    }
  }
}

export const emailService = new EmailService()