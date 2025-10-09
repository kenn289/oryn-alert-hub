import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/support/tickets - Get tickets for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get tickets for the user
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tickets:', error)
      
      // Check if it's a table not found error
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        return NextResponse.json({ 
          error: 'Database table not found',
          message: 'The support_tickets table is missing. Please run the database setup script.',
          tickets: []
        }, { status: 503 })
      }
      
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    return NextResponse.json(tickets || [])
  } catch (error) {
    console.error('Error in GET /api/support/tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/support/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject, description, priority, category, userId, userEmail } = body

    if (!subject || !description || !userId || !userEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create new ticket
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        subject,
        description,
        priority: priority || 'medium',
        category: category || 'general',
        status: 'open',
        user_id: userId,
        user_email: userEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ticket:', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // Send email notification to admin (simulated)
    try {
      const { simpleEmailService } = await import('../../../../src/lib/simple-email-service')
      await simpleEmailService.sendTicketNotification(ticket)
      console.log('✅ Email notification logged for ticket:', ticket.id)
    } catch (emailError) {
      console.error('❌ Failed to log email notification:', emailError)
      // Don't fail the ticket creation if email fails
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error in POST /api/support/tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/support/tickets - Update ticket (for rating)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, rating, feedback } = body

    if (!ticketId || !rating) {
      return NextResponse.json({ error: 'Ticket ID and rating are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Update ticket with rating
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update({
        rating: rating,
        feedback: feedback || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single()

    if (error) {
      console.error('Error updating ticket rating:', error)
      return NextResponse.json({ error: 'Failed to update ticket rating' }, { status: 500 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error in PUT /api/support/tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendEmailNotification(ticket: any, type: string) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@oryn.com'
    
    const emailContent = {
      to: adminEmail,
      subject: `New Support Ticket: ${ticket.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00d4aa;">New Support Ticket</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Ticket Details:</h3>
            <p><strong>ID:</strong> ${ticket.id}</p>
            <p><strong>Subject:</strong> ${ticket.subject}</p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            <p><strong>Category:</strong> ${ticket.category}</p>
            <p><strong>User:</strong> ${ticket.user_email}</p>
            <p><strong>Created:</strong> ${new Date(ticket.created_at).toLocaleString('en-US', { timeZone: 'UTC' })}</p>
          </div>
          <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3>Description:</h3>
            <p style="white-space: pre-wrap;">${ticket.description}</p>
          </div>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/support/${ticket.id}" 
               style="background: #00d4aa; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Ticket
            </a>
          </div>
        </div>
      `
    }

    // Send email using your preferred email service
    // This is a placeholder - you'll need to implement actual email sending
    console.log('Email notification:', emailContent)
    
    // For now, we'll just log it. In production, use a service like SendGrid, Resend, or Nodemailer
    console.log(`Support ticket ${ticket.id} created for ${ticket.user_email}`)
    
  } catch (error) {
    console.error('Error sending email notification:', error)
  }
}

