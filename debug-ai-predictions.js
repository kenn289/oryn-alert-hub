// Debug AI predictions issue
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAIPredictions() {
  console.log('🔍 Debugging AI predictions issue...')
  
  try {
    // Step 1: Check if user has any watchlist data
    console.log('\n1. Checking for existing watchlist data...')
    
    // Check watchlists_fixed table
    const { data: watchlistData, error: watchlistError } = await supabase
      .from('watchlists_fixed')
      .select('*')
      .limit(10)
    
    if (watchlistError) {
      console.log('❌ watchlists_fixed error:', watchlistError.message)
    } else {
      console.log('✅ watchlists_fixed accessible')
      console.log('Records found:', watchlistData.length)
      if (watchlistData.length > 0) {
        console.log('Sample records:', watchlistData.slice(0, 3))
      }
    }
    
    // Check watchlist_items table (old table)
    const { data: oldWatchlistData, error: oldWatchlistError } = await supabase
      .from('watchlist_items')
      .select('*')
      .limit(10)
    
    if (oldWatchlistError) {
      console.log('❌ watchlist_items error:', oldWatchlistError.message)
    } else {
      console.log('✅ watchlist_items accessible')
      console.log('Records found:', oldWatchlistData.length)
      if (oldWatchlistData.length > 0) {
        console.log('Sample records:', oldWatchlistData.slice(0, 3))
      }
    }
    
    // Step 2: Create test watchlist data
    console.log('\n2. Creating test watchlist data...')
    
    const testUserId = 'test-user-' + Date.now()
    const testWatchlistItems = [
      {
        user_id: testUserId,
        ticker: 'NVDA',
        name: 'NVIDIA Corporation',
        price: 187.62,
        change: 2.45,
        change_percent: 1.32,
        currency: 'USD',
        market: 'US'
      },
      {
        user_id: testUserId,
        ticker: 'AAPL',
        name: 'Apple Inc.',
        price: 225.89,
        change: -1.23,
        change_percent: -0.54,
        currency: 'USD',
        market: 'US'
      },
      {
        user_id: testUserId,
        ticker: 'TSLA',
        name: 'Tesla Inc.',
        price: 245.67,
        change: 5.78,
        change_percent: 2.41,
        currency: 'USD',
        market: 'US'
      }
    ]
    
    // Insert test data
    const { data: insertData, error: insertError } = await supabase
      .from('watchlists_fixed')
      .insert(testWatchlistItems)
      .select()
    
    if (insertError) {
      console.log('❌ Failed to insert test data:', insertError.message)
    } else {
      console.log('✅ Test watchlist data created successfully!')
      console.log('Inserted records:', insertData.length)
      
      // Clean up test data
      await supabase
        .from('watchlists_fixed')
        .delete()
        .eq('user_id', testUserId)
      console.log('🧹 Test data cleaned up')
    }
    
    // Step 3: Test AI predictions with mock data
    console.log('\n3. Testing AI predictions with mock data...')
    
    const mockSymbols = ['NVDA', 'AAPL', 'TSLA']
    console.log('Mock symbols for AI predictions:', mockSymbols)
    
    // Test stock API for each symbol
    for (const symbol of mockSymbols) {
      try {
        const response = await fetch(`http://localhost:3000/api/stock/multi/${symbol}`)
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ ${symbol}: $${data.price} (${data.changePercent.toFixed(2)}%)`)
        } else {
          console.log(`❌ ${symbol}: API error ${response.status}`)
        }
      } catch (error) {
        console.log(`❌ ${symbol}: ${error.message}`)
      }
    }
    
    console.log('\n🎉 Debug completed!')
    console.log('\n💡 Solutions for AI predictions:')
    console.log('1. Add stocks to your watchlist in the app')
    console.log('2. The AI predictions will show for your watchlisted stocks')
    console.log('3. If still not working, check browser console for errors')
    console.log('4. Make sure you\'re logged in and have stocks in your watchlist')
    
  } catch (error) {
    console.error('❌ Debug error:', error)
  }
}

debugAIPredictions()
