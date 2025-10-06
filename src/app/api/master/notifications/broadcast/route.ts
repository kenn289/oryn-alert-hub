import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { title, message, type } = await request.json()

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    // Get all users from the users table instead of auth
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }

    // Create notifications for all users
    const notifications = users.map(user => ({
      user_id: user.id,
      type: type || 'info',
      title,
      message,
      read: false,
      created_at: new Date().toISOString()
    }))

    // Insert notifications into the database
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (insertError) {
      console.error('Error inserting notifications:', insertError)
      return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 })
    }

    // Send real-time notifications to all users
    const { realtimeNotificationService } = await import('../../../../../lib/realtime-notifications')
    await realtimeNotificationService.broadcastNotification(title, message, type)

    return NextResponse.json({ 
      success: true, 
      message: `Notification sent to ${users.length} users`,
      count: users.length
    })

  } catch (error) {
    console.error('Error in POST /api/master/notifications/broadcast:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

