import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Clear any pending payments for this user
    const { error: deleteError } = await supabase
      .from('payment_orders')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'created')

    if (deleteError) {
      console.error('Error clearing pending payments:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to clear pending payments' 
      }, { status: 500 })
    }

    console.log(`✅ Cleared pending payments for user: ${userId}`)
    return NextResponse.json({ 
      success: true, 
      message: 'Pending payments cleared successfully' 
    })

  } catch (error) {
    console.error('Clear pending payments error:', error)
    return NextResponse.json({ 
      error: 'Failed to clear pending payments' 
    }, { status: 500 })
  }
}
