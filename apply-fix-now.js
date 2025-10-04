// Apply Database Fix Now - Direct Supabase Connection
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Applying database fix now...\n');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Database fix SQL
const fixSQL = `
-- Create notifications table (THE MISSING TABLE!)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('ticket_created', 'ticket_resolved', 'user_joined', 'alert_triggered', 'plan_updated')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'master')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create support_tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (category IN ('technical', 'billing', 'feature_request', 'bug_report', 'general')),
  user_id UUID NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(255),
  resolution TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  response_time INTEGER,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'pro', 'team')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  razorpay_subscription_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Allow all operations on notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on support_tickets" ON support_tickets FOR ALL USING (true);
CREATE POLICY "Allow all operations on subscriptions" ON subscriptions FOR ALL USING (true);

-- Insert master account
INSERT INTO users (email, plan, is_active) 
VALUES ('kennethoswin289@gmail.com', 'master', TRUE)
ON CONFLICT (email) DO UPDATE SET plan = 'master', is_active = TRUE;

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message) VALUES 
('0c728692-f22b-4eea-91cc-f9d075996d21', 'ticket_created', 'Welcome!', 'Welcome to Oryn Alert Hub'),
('0c728692-f22b-4eea-91cc-f9d075996d21', 'alert_triggered', 'Stock Alert', 'Your stock alert has been triggered')
ON CONFLICT DO NOTHING;
`;

async function applyFix() {
  try {
    console.log('📡 Connecting to Supabase...');
    
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      return false;
    }
    
    console.log('✅ Connected to Supabase');
    console.log('🔧 Applying database fix...');
    
    // Execute the fix SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: fixSQL });
    
    if (error) {
      console.error('❌ Database fix failed:', error.message);
      return false;
    }
    
    console.log('✅ Database fix applied successfully!');
    
    // Test if notifications table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['notifications', 'users', 'support_tickets', 'subscriptions']);
    
    if (tableError) {
      console.error('❌ Could not verify tables:', tableError.message);
      return false;
    }
    
    console.log('📋 Tables created:');
    tables.forEach(table => {
      console.log(`   ✅ ${table.table_name}`);
    });
    
    return true;
    
  } catch (error) {
    console.error('💥 Fix application failed:', error.message);
    return false;
  }
}

// Run the fix
applyFix().then(success => {
  if (success) {
    console.log('\n🎉 Database fix completed successfully!');
    console.log('✅ The notifications table should now exist');
    console.log('✅ API endpoints should work properly');
    console.log('✅ No more "table not found" errors');
    process.exit(0);
  } else {
    console.log('\n💥 Database fix failed!');
    console.log('📝 Manual fix required:');
    console.log('1. Go to Supabase dashboard → SQL Editor');
    console.log('2. Copy and paste the contents of fix-database.sql');
    console.log('3. Run the SQL script');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Fix crashed:', error);
  process.exit(1);
});
