import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Ensure environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4NDg0NSwiZXhwIjoyMDc0OTYwODQ1fQ.JMLCsJjRBsO7baZ1-heVOSjYbxpH2N-Ff1JTCKjUJ50'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log(`🔄 Refreshing company names for user: ${userId}`)

    // Get user's watchlist from database
    const { data: watchlist, error: watchlistError } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', userId)

    if (watchlistError) {
      console.error('Error fetching watchlist:', watchlistError)
      return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 })
    }

    console.log(`📊 Found ${watchlist.length} watchlist items to process`)

    // Update company names for each item
    const updatedItems = []
    for (const item of watchlist) {
      try {
        // Fetch company name from stock API
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stock/global/${item.ticker}`)
        if (response.ok) {
          const stockData = await response.json()
          const companyName = stockData.name || item.name || 'Unknown Company'
          
          // Update the item in database
          const { error: updateError } = await supabase
            .from('watchlists')
            .update({ name: companyName })
            .eq('id', item.id)

          if (updateError) {
            console.error(`Failed to update ${item.ticker}:`, updateError)
          } else {
            console.log(`✅ Updated ${item.ticker}: ${companyName}`)
            updatedItems.push({ ticker: item.ticker, name: companyName })
          }
        } else {
          console.warn(`Failed to fetch data for ${item.ticker}: ${response.status}`)
        }
      } catch (error) {
        console.error(`Error processing ${item.ticker}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated company names for ${updatedItems.length} items`,
      updatedItems
    })

  } catch (error) {
    console.error('Error refreshing company names:', error)
    return NextResponse.json({ 
      error: 'Failed to refresh company names' 
    }, { status: 500 })
  }
}
