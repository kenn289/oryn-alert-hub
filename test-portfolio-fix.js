// Test the portfolio service fix
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPortfolioFix() {
  console.log('🔧 Testing portfolio service fix...')
  
  try {
    // Test the portfolio_items table
    console.log('Testing portfolio_items table...')
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', 'test-user')
      .limit(1)
    
    if (error) {
      console.log('❌ Portfolio query failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('✅ Portfolio query successful!')
      console.log('Data:', data)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testPortfolioFix()
