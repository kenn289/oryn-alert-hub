// Test script to check if database columns exist
// Run this to verify the support_tickets table structure

const { createClient } = require('@supabase/supabase-js')

// You'll need to add your Supabase URL and anon key here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseColumns() {
  try {
    console.log('🔍 Testing database columns...')
    
    // Test if we can query the support_tickets table
    const { data, error } = await supabase
      .from('support_tickets')
      .select('id, subject, rating, feedback')
      .limit(1)
    
    if (error) {
      console.error('❌ Error querying support_tickets:', error)
      
      if (error.code === 'PGRST204') {
        console.log('🔧 Missing columns detected!')
        console.log('📋 Please run the ADD_MISSING_COLUMNS.sql script in your Supabase SQL Editor')
        return
      }
    } else {
      console.log('✅ Database columns are working correctly!')
      console.log('📊 Sample data:', data)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDatabaseColumns()
