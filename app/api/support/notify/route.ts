import { NextRequest, NextResponse } from 'next/server'

// POST /api/support/notify - Send email notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticket, type, recipientEmail } = body

    if (!ticket || !type || !recipientEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // For now, we'll just log the notification
    // In production, you would integrate with an email service like SendGrid, Resend, or Nodemailer
    console.log('=== SUPPORT TICKET NOTIFICATION ===')
    console.log('Type:', type)
    console.log('Recipient:', recipientEmail)
    console.log('Ticket ID:', ticket.id)
    console.log('Subject:', ticket.subject)
    console.log('Priority:', ticket.priority)
    console.log('User:', ticket.user_email)
    console.log('Created:', ticket.created_at)
    console.log('=====================================')

    // TODO: Implement actual email sending
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    // 
    // const msg = {
    //   to: recipientEmail,
    //   from: 'noreply@oryn.com',
    //   subject: `New Support Ticket: ${ticket.subject}`,
    //   html: generateEmailTemplate(ticket, type)
    // }
    // 
    // await sgMail.send(msg)

    return NextResponse.json({ success: true, message: 'Notification logged' })
  } catch (error) {
    console.error('Error in POST /api/support/notify:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate email template
function generateEmailTemplate(ticket: any, type: string) {
  const isNewTicket = type === 'ticket_created'
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #00d4aa, #00a8cc); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">
          ${isNewTicket ? 'New Support Ticket' : 'Support Ticket Update'}
        </h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #333;">Ticket Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 120px;">Ticket ID:</td>
            <td style="padding: 8px 0;">${ticket.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Subject:</td>
            <td style="padding: 8px 0;">${ticket.subject}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Priority:</td>
            <td style="padding: 8px 0;">
              <span style="background: ${getPriorityColor(ticket.priority)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${ticket.priority.toUpperCase()}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Status:</td>
            <td style="padding: 8px 0;">
              <span style="background: ${getStatusColor(ticket.status)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${ticket.status.toUpperCase()}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">User:</td>
            <td style="padding: 8px 0;">${ticket.user_email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Created:</td>
            <td style="padding: 8px 0;">${new Date(ticket.created_at).toLocaleString('en-US', { timeZone: 'UTC' })}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #333;">Description</h3>
        <p style="white-space: pre-wrap; line-height: 1.6;">${ticket.description}</p>
      </div>
      
      ${ticket.resolution ? `
        <div style="background: #e8f5e8; padding: 20px; border: 1px solid #4caf50; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #2e7d32;">Resolution</h3>
          <p style="white-space: pre-wrap; line-height: 1.6; margin: 0;">${ticket.resolution}</p>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/support/${ticket.id}" 
           style="background: #00d4aa; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Ticket
        </a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
        <p>This is an automated notification from Oryn Support System</p>
        <p>Please do not reply to this email. Use the support portal to respond.</p>
      </div>
    </div>
  `
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent': return '#f44336'
    case 'high': return '#ff9800'
    case 'medium': return '#2196f3'
    case 'low': return '#4caf50'
    default: return '#9e9e9e'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'open': return '#f44336'
    case 'in_progress': return '#ff9800'
    case 'resolved': return '#4caf50'
    case 'closed': return '#9e9e9e'
    default: return '#9e9e9e'
  }
}

