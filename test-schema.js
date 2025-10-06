// Test the actual database schema
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSchema() {
  console.log('🔍 Testing database schema...')
  
  try {
    // Test with a proper UUID format
    const testUuid = '550e8400-e29b-41d4-a716-446655440000'
    
    console.log('Testing with UUID format:', testUuid)
    const { data, error } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('user_id', testUuid)
      .limit(1)
    
    if (error) {
      console.log('❌ UUID test failed:', error.message)
    } else {
      console.log('✅ UUID test passed:', data)
    }
    
    // Test with string format
    console.log('\nTesting with string format: test-user')
    const { data: stringData, error: stringError } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('user_id', 'test-user')
      .limit(1)
    
    if (stringError) {
      console.log('❌ String test failed:', stringError.message)
    } else {
      console.log('✅ String test passed:', stringData)
    }
    
    // Try to insert with UUID
    console.log('\nTesting insert with UUID...')
    const { data: insertData, error: insertError } = await supabase
      .from('watchlist_items')
      .insert({
        user_id: testUuid,
        ticker: 'AAPL',
        name: 'Apple Inc.'
      })
      .select()
    
    if (insertError) {
      console.log('❌ Insert with UUID failed:', insertError.message)
    } else {
      console.log('✅ Insert with UUID succeeded:', insertData)
      
      // Clean up
      await supabase
        .from('watchlist_items')
        .delete()
        .eq('user_id', testUuid)
      console.log('🧹 Cleaned up test record')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testSchema()
