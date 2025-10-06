// Fix the watchlist service to handle the database schema correctly
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWatchlistService() {
  console.log('🔧 Testing watchlist service with proper error handling...')
  
  try {
    // Test the exact same query that's failing in the browser
    const userId = 'test-user-string-id' // This is what the app is likely using
    
    console.log('Testing with string user ID:', userId)
    const { data, error } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false })
    
    if (error) {
      console.log('❌ Query failed with error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // This is the error that's being logged as {} in the browser
      console.log('🔍 The error object being logged:', error)
      
      if (error.code === '22P02') {
        console.log('💡 Solution: The user_id field expects a UUID format, not a string')
        console.log('💡 The application needs to use UUID format for user IDs')
      }
    } else {
      console.log('✅ Query succeeded:', data)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testWatchlistService()
