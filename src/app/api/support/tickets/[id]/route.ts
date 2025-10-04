import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/support/tickets/[id] - Get a specific ticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const supabase = createClient()
    
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching ticket:', error)
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error in GET /api/support/tickets/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/support/tickets/[id] - Update a ticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, resolution, assignedTo } = body

    const supabase = createClient()
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (resolution) updateData.resolution = resolution
    if (assignedTo) updateData.assigned_to = assignedTo

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating ticket:', error)
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    // Send email notification if status changed
    if (status && status !== 'open') {
      await sendStatusUpdateEmail(ticket)
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error in PATCH /api/support/tickets/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendStatusUpdateEmail(ticket: any) {
  try {
    const emailContent = {
      to: ticket.user_email,
      subject: `Support Ticket Update: ${ticket.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00d4aa;">Support Ticket Update</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Ticket Details:</h3>
            <p><strong>ID:</strong> ${ticket.id}</p>
            <p><strong>Subject:</strong> ${ticket.subject}</p>
            <p><strong>Status:</strong> ${ticket.status}</p>
            <p><strong>Updated:</strong> ${new Date(ticket.updated_at).toLocaleString('en-US', { timeZone: 'UTC' })}</p>
          </div>
          ${ticket.resolution ? `
            <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h3>Resolution:</h3>
              <p style="white-space: pre-wrap;">${ticket.resolution}</p>
            </div>
          ` : ''}
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" 
               style="background: #00d4aa; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View All Tickets
            </a>
          </div>
        </div>
      `
    }

    console.log('Status update email:', emailContent)
    console.log(`Support ticket ${ticket.id} status updated to ${ticket.status} for ${ticket.user_email}`)
    
  } catch (error) {
    console.error('Error sending status update email:', error)
  }
}
