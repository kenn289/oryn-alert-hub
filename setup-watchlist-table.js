// Setup watchlist table using Supabase client
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4NDg0NSwiZXhwIjoyMDc0OTYwODQ1fQ.JMLCsJjRBsO7baZ1-heVOSjYbxpH2N-Ff1JTCKjUJ50'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupWatchlistTable() {
  console.log('🔧 Setting up watchlists table...')
  
  try {
    // First, let's try to create a simple test record to see if the table exists
    console.log('Testing if watchlists table exists...')
    
    const { data: testData, error: testError } = await supabase
      .from('watchlists')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.log('❌ watchlists table does not exist:', testError.message)
      console.log('💡 The table needs to be created in the Supabase dashboard or via SQL')
      console.log('📋 Please run the SQL from create-watchlists-table.sql in your Supabase dashboard')
    } else {
      console.log('✅ watchlists table exists!')
    }
    
    // Let's also check what tables we can access
    console.log('\n🔍 Checking available tables...')
    
    const tables = ['users', 'portfolios', 'watchlists', 'watchlist_items', 'user_preferences']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: exists (${data[0]?.count || 0} records)`)
        }
      } catch (e) {
        console.log(`❌ ${table}: ${e.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

setupWatchlistTable()
