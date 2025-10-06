// Test the watchlist fix
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWatchlistFix() {
  console.log('🔍 Testing watchlist table fix...')
  
  try {
    // Test the correct table name
    const { data, error } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('user_id', 'test-user')
      .order('added_at', { ascending: false })

    if (error) {
      console.error('❌ Watchlist query failed:', error)
    } else {
      console.log('✅ Watchlist query successful!')
      console.log('Data:', data)
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testWatchlistFix()
