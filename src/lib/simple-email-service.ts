// Simple email service that logs to console instead of sending real emails
// This avoids nodemailer dependency issues

export class SimpleEmailService {
  // Log ticket notification to console
  async sendTicketNotification(ticket: any) {
    console.log('📧 EMAIL NOTIFICATION (Simulated)')
    console.log('================================')
    console.log('🚨 New Support Ticket Created!')
    console.log('')
    console.log('📋 Ticket Details:')
    console.log(`   ID: ${ticket.id}`)
    console.log(`   Subject: ${ticket.subject}`)
    console.log(`   Priority: ${ticket.priority.toUpperCase()}`)
    console.log(`   Status: ${ticket.status.toUpperCase()}`)
    console.log(`   User: ${ticket.user_email}`)
    console.log(`   Created: ${new Date(ticket.created_at).toLocaleString('en-US', { timeZone: 'UTC' })}`)
    console.log('')
    console.log('📝 Description:')
    console.log(`   ${ticket.description}`)
    console.log('')
    console.log('🎯 Action Required:')
    console.log('   - Check your email for the full notification')
    console.log('   - Reply to update ticket status')
    console.log('   - Update ticket in database if needed')
    console.log('================================')
    
    // In production, you would send a real email here
    // For now, this just logs the notification
    return { success: true, messageId: `simulated-${Date.now()}` }
  }

  // Log ticket update to console
  async sendTicketUpdate(ticket: any, updateType: string) {
    console.log('📧 EMAIL UPDATE (Simulated)')
    console.log('============================')
    console.log(`📧 Ticket Update: ${updateType}`)
    console.log(`   Ticket: ${ticket.subject}`)
    console.log(`   Status: ${ticket.status.toUpperCase()}`)
    console.log(`   User: ${ticket.user_email}`)
    console.log('============================')
    
    return { success: true, messageId: `simulated-update-${Date.now()}` }
  }
}

export const simpleEmailService = new SimpleEmailService()

