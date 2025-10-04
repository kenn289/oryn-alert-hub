import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { plan } = await request.json()
    const { id: userId } = await params

    if (!plan || !['free', 'pro', 'master'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Update user plan in the users table instead of auth metadata
    const { data, error } = await supabase
      .from('users')
      .update({ 
        plan: plan,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user plan:', error)
      
      // Check if it's a table not found error
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        return NextResponse.json({ 
          error: 'Database table not found. Please run the database setup script.',
          details: 'The users table is missing. Run COMPLETE_DATABASE_SETUP_FINAL.sql in your Supabase SQL Editor.'
        }, { status: 503 })
      }
      
      return NextResponse.json({ error: 'Failed to update user plan' }, { status: 500 })
    }

    return NextResponse.json({ success: true, plan, user: data })
  } catch (error) {
    console.error('Error in PUT /api/master/users/[id]/plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}