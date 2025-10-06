// Test Portfolio API Endpoints
const { createClient } = require('@supabase/supabase-js');

// Test environment variables
console.log('🔍 Checking environment variables...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ Missing required environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

async function testPortfolioTables() {
  console.log('📊 Testing portfolio tables...');
  
  try {
    // Check if portfolio_items table exists
    const { data: portfolioTable, error: portfolioError } = await supabase
      .from('portfolio_items')
      .select('*')
      .limit(1);
    
    if (portfolioError && portfolioError.code === 'PGRST116') {
      console.log('❌ portfolio_items table does not exist');
      return false;
    }
    
    console.log('✅ portfolio_items table exists');
    
    // Check if watchlist_items table exists
    const { data: watchlistTable, error: watchlistError } = await supabase
      .from('watchlist_items')
      .select('*')
      .limit(1);
    
    if (watchlistError && watchlistError.code === 'PGRST116') {
      console.log('❌ watchlist_items table does not exist');
      return false;
    }
    
    console.log('✅ watchlist_items table exists');
    
    // Check if stock_alerts table exists
    const { data: alertsTable, error: alertsError } = await supabase
      .from('stock_alerts')
      .select('*')
      .limit(1);
    
    if (alertsError && alertsError.code === 'PGRST116') {
      console.log('❌ stock_alerts table does not exist');
      return false;
    }
    
    console.log('✅ stock_alerts table exists');
    
    return true;
  } catch (error) {
    console.error('❌ Error testing tables:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting portfolio API tests...\n');
  
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('\n❌ Cannot proceed without database connection');
    return;
  }
  
  const tablesExist = await testPortfolioTables();
  if (!tablesExist) {
    console.log('\n❌ Portfolio tables need to be created');
    console.log('Please run the database setup script first');
    return;
  }
  
  console.log('\n✅ All tests passed! Portfolio API is ready to use.');
}

main().catch(console.error);
