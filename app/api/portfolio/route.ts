import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// GET /api/portfolio - Get user's portfolio
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: portfolio, error } = await getSupabaseClient()
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Error fetching portfolio:', error)
      return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 })
    }

    return NextResponse.json({ portfolio: portfolio || [] })
  } catch (error) {
    console.error('Portfolio GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/portfolio - Add new portfolio item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ticker, name, shares, avgPrice, currentPrice, market, currency, exchange } = body

    if (!userId || !ticker || !shares || !avgPrice || !currentPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const totalValue = shares * currentPrice
    const gainLoss = totalValue - (shares * avgPrice)
    const gainLossPercent = avgPrice > 0 ? (gainLoss / (shares * avgPrice)) * 100 : 0

    const { data, error } = await getSupabaseClient()
      .from('portfolios')
      .insert({
        user_id: userId,
        ticker: ticker.toUpperCase(),
        name: name || ticker.toUpperCase(),
        shares: parseFloat(shares),
        avg_price: parseFloat(avgPrice),
        current_price: parseFloat(currentPrice),
        total_value: totalValue,
        gain_loss: gainLoss,
        gain_loss_percent: gainLossPercent,
        market: market || 'US',
        currency: currency || 'USD',
        exchange: exchange || (market === 'IN' ? 'NSE' : market === 'US' ? 'NASDAQ' : 'Unknown')
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding portfolio item:', error)
      return NextResponse.json({ error: 'Failed to save portfolio item' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `${ticker} added to portfolio!`,
      item: data 
    })
  } catch (error) {
    console.error('Portfolio POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/portfolio - Update portfolio item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, shares, avgPrice, currentPrice } = body

    if (!id || !shares || !avgPrice || !currentPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const totalValue = shares * currentPrice
    const gainLoss = totalValue - (shares * avgPrice)
    const gainLossPercent = avgPrice > 0 ? (gainLoss / (shares * avgPrice)) * 100 : 0

    const { data, error } = await getSupabaseClient()
      .from('portfolios')
      .update({
        shares: parseFloat(shares),
        avg_price: parseFloat(avgPrice),
        current_price: parseFloat(currentPrice),
        total_value: totalValue,
        gain_loss: gainLoss,
        gain_loss_percent: gainLossPercent
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating portfolio item:', error)
      return NextResponse.json({ error: 'Failed to update portfolio item' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Portfolio item updated!',
      item: data 
    })
  } catch (error) {
    console.error('Portfolio PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/portfolio - Delete portfolio item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const { error } = await getSupabaseClient()
      .from('portfolios')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting portfolio item:', error)
      return NextResponse.json({ error: 'Failed to delete portfolio item' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Portfolio item deleted!' 
    })
  } catch (error) {
    console.error('Portfolio DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

