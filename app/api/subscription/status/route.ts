import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { subscriptionLifecycleService } from '../../../../src/lib/subscription-lifecycle-service'

// Ensure environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4NDg0NSwiZXhwIjoyMDc0OTYwODQ1fQ.JMLCsJjRBsO7baZ1-heVOSjYbxpH2N-Ff1JTCKjUJ50'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Get subscription status
    const subscription = await subscriptionLifecycleService.getSubscriptionStatus(userId)
    
    if (!subscription) {
      return NextResponse.json({ 
        subscription: null,
        message: 'No active subscription found' 
      })
    }
    
    return NextResponse.json({
      subscription,
      message: 'Subscription status retrieved successfully'
    })
    
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch subscription status' 
    }, { status: 500 })
  }
}

