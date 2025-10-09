import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// GET /api/watchlist - Get user's watchlist
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: watchlist, error } = await getSupabaseClient()
      .from('watchlists')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Error fetching watchlist:', error)
      return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 })
    }

    return NextResponse.json({ watchlist: watchlist || [] })
  } catch (error) {
    console.error('Watchlist GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/watchlist - Add new watchlist item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ticker, name, market, currency } = body

    if (!userId || !ticker) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if item already exists
    const { data: existing } = await getSupabaseClient()
      .from('watchlists')
      .select('id')
      .eq('user_id', userId)
      .eq('ticker', ticker.toUpperCase())
      .eq('market', market || 'US')
      .single()

    if (existing) {
      return NextResponse.json({ 
        success: false, 
        message: `${ticker} is already in your watchlist` 
      }, { status: 409 })
    }

    const { data, error } = await getSupabaseClient()
      .from('watchlists')
      .insert({
        user_id: userId,
        ticker: ticker.toUpperCase(),
        name: name || ticker.toUpperCase(),
        market: market || 'US',
        currency: currency || 'USD'
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding watchlist item:', error)
      return NextResponse.json({ error: 'Failed to save watchlist item' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `${ticker} added to watchlist!`,
      item: data 
    })
  } catch (error) {
    console.error('Watchlist POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/watchlist - Delete watchlist item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const { error } = await getSupabaseClient()
      .from('watchlists')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting watchlist item:', error)
      return NextResponse.json({ error: 'Failed to delete watchlist item' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Watchlist item deleted!' 
    })
  } catch (error) {
    console.error('Watchlist DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

