import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// PUT /api/master/tickets/[id] - Update ticket (master only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, resolution } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Update ticket
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update({
        status,
        resolution: resolution || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating ticket:', error)
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    // Create notification for user if ticket is resolved
    if (status === 'resolved' && ticket) {
      await supabase
        .from('notifications')
        .insert({
          user_id: ticket.user_id,
          type: 'ticket_resolved',
          title: 'Ticket Resolved',
          message: `Your ticket "${ticket.subject}" has been resolved.`,
          read: false,
          created_at: new Date().toISOString()
        })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error in PUT /api/master/tickets/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

