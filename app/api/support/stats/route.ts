import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/support/stats - Get support statistics
export async function GET() {
  try {
    // Use the supabase client defined above
    
    // Get all tickets for stats calculation
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')

    if (error) {
      console.error('Error fetching tickets for stats:', error)
      
      // Check if it's a table not found error
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        return NextResponse.json({ 
          error: 'Database table not found. Please run the database setup script.',
          details: 'The support_tickets table is missing. Run fix-database.sql in your Supabase SQL Editor.',
          stats: {
            openTickets: 0,
            resolvedThisMonth: 0,
            averageResponseTime: 0,
            customerRating: 0,
            totalTickets: 0
          }
        }, { status: 503 })
      }
      
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    // Calculate stats
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const openTickets = tickets?.filter(t => t.status === 'open').length || 0
    const resolvedThisMonth = tickets?.filter(t => 
      t.status === 'resolved' && new Date(t.updated_at) >= thisMonth
    ).length || 0
    
    // Calculate average response time (simplified)
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved' && t.response_time) || []
    const averageResponseTime = resolvedTickets.length > 0 
      ? Math.round(resolvedTickets.reduce((sum, t) => sum + t.response_time, 0) / resolvedTickets.length)
      : 0
    
    // Calculate average rating from tickets with ratings
    const ratedTickets = tickets?.filter(t => t.rating && t.rating >= 1 && t.rating <= 5) || []
    const customerRating = ratedTickets.length > 0
      ? Math.round((ratedTickets.reduce((sum, t) => sum + t.rating, 0) / ratedTickets.length) * 10) / 10
      : 0

    const stats = {
      openTickets,
      resolvedThisMonth,
      averageResponseTime,
      customerRating: Math.round(customerRating * 10) / 10, // Round to 1 decimal
      totalTickets: tickets?.length || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in GET /api/support/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

