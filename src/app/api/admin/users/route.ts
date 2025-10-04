import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/admin/users - Get all users (admin only)
export async function GET() {
  try {
    // Get all users from auth.users table
    const { data: users, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get subscription data for each user
    const usersWithPlans = await Promise.all(
      users.users.map(async (user) => {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_id', user.id)
          .single()

        return {
          id: user.id,
          email: user.email,
          plan: subscription?.plan || 'free',
          created_at: user.created_at,
          last_login: user.last_sign_in_at
        }
      })
    )

    return NextResponse.json(usersWithPlans)
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

