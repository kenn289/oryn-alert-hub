import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get users from the users table instead of auth.users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      
      // Check if it's a table not found error
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        return NextResponse.json({ 
          error: 'Database table not found. Please run the database setup script.',
          details: 'The users table is missing. Run fix-database.sql in your Supabase SQL Editor.',
          users: []
        }, { status: 503 })
      }
      
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Transform the data to match expected format
    const usersWithPlans = (users || []).map(user => ({
      id: user.id,
      email: user.email,
      plan: user.plan || 'free',
      created_at: user.created_at,
      last_login: user.last_login,
      is_active: user.is_active !== false
    }))

    return NextResponse.json(usersWithPlans)
  } catch (error) {
    console.error('Error in GET /api/master/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

