// Test database connection and diagnose issues
// Run this to check if the database is properly set up

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...')
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key (first 20 chars):', supabaseKey.substring(0, 20) + '...')
  
  try {
    // Test 1: Basic connectivity
    console.log('\n1. Testing basic connectivity...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Basic connectivity failed:', testError)
      console.error('Error details:', {
        code: testError.code,
        message: testError.message,
        details: testError.details,
        hint: testError.hint
      })
    } else {
      console.log('✅ Basic connectivity works')
    }
    
    // Test 2: Check if users table exists
    console.log('\n2. Testing users table...')
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (usersError) {
      console.error('❌ Users table test failed:', usersError)
      console.error('Error details:', {
        code: usersError.code,
        message: usersError.message,
        details: usersError.details,
        hint: usersError.hint
      })
    } else {
      console.log('✅ Users table exists and is accessible')
      console.log('Users count:', usersData?.length || 0)
    }
    
    // Test 3: Try to insert a test record
    console.log('\n3. Testing user insertion...')
    const testUserId = 'test-user-' + Date.now()
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        plan: 'free',
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ User insertion failed:', insertError)
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
    } else {
      console.log('✅ User insertion works')
      console.log('Inserted user:', insertData)
      
      // Clean up test record
      await supabase
        .from('users')
        .delete()
        .eq('id', testUserId)
      console.log('🧹 Cleaned up test record')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testDatabaseConnection()
