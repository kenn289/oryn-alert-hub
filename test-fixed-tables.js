// Test the fixed tables to ensure they work correctly
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFixedTables() {
  console.log('🔧 Testing fixed tables...')
  
  try {
    // Test watchlists_fixed table
    console.log('\n1. Testing watchlists_fixed table...')
    const { data: watchlistData, error: watchlistError } = await supabase
      .from('watchlists_fixed')
      .select('*')
      .eq('user_id', 'test-user-string-id')
      .limit(1)
    
    if (watchlistError) {
      console.log('❌ watchlists_fixed test failed:', watchlistError.message)
    } else {
      console.log('✅ watchlists_fixed table works! (String user_id accepted)')
    }
    
    // Test portfolios_fixed table
    console.log('\n2. Testing portfolios_fixed table...')
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('portfolios_fixed')
      .select('*')
      .eq('user_id', 'test-user-string-id')
      .limit(1)
    
    if (portfolioError) {
      console.log('❌ portfolios_fixed test failed:', portfolioError.message)
    } else {
      console.log('✅ portfolios_fixed table works! (String user_id accepted)')
    }
    
    // Test inserting a record into watchlists_fixed
    console.log('\n3. Testing insert into watchlists_fixed...')
    const { data: insertData, error: insertError } = await supabase
      .from('watchlists_fixed')
      .insert({
        user_id: 'test-user-string-id',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        price: 150.00,
        change: 2.50,
        change_percent: 1.69
      })
      .select()
    
    if (insertError) {
      console.log('❌ Insert into watchlists_fixed failed:', insertError.message)
    } else {
      console.log('✅ Insert into watchlists_fixed succeeded!')
      console.log('Inserted record:', insertData)
      
      // Clean up test record
      await supabase
        .from('watchlists_fixed')
        .delete()
        .eq('user_id', 'test-user-string-id')
        .eq('ticker', 'AAPL')
      console.log('🧹 Cleaned up test record')
    }
    
    console.log('\n🎉 All tests completed!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testFixedTables()
