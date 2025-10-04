// Database Setup Script for Oryn Alert Hub
// This script sets up all required database tables

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Database setup SQL
const setupSQL = `
-- Complete Database Setup for Oryn Alert Hub
-- This script creates all required tables and relationships

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'master')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- 2. Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (category IN ('technical', 'billing', 'feature_request', 'bug_report', 'general')),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(255),
  resolution TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  response_time INTEGER,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('ticket_created', 'ticket_resolved', 'user_joined', 'alert_triggered', 'plan_updated')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- 5. Create payment_events table
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  razorpay_payment_id VARCHAR(255),
  amount INTEGER,
  currency VARCHAR(3),
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 7. Create update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at 
    BEFORE UPDATE ON support_tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- 10. Create policies
-- Master can see all users
CREATE POLICY "Master can view all users" ON users
    FOR SELECT USING (email = 'kennethoswin289@gmail.com');

-- Master can update all users
CREATE POLICY "Master can update all users" ON users
    FOR UPDATE USING (email = 'kennethoswin289@gmail.com');

-- Master can see all tickets
CREATE POLICY "Master can view all tickets" ON support_tickets
    FOR SELECT USING (true);

-- Master can update all tickets
CREATE POLICY "Master can update all tickets" ON support_tickets
    FOR UPDATE USING (true);

-- Master can see all notifications
CREATE POLICY "Master can view all notifications" ON notifications
    FOR SELECT USING (true);

-- Master can see all subscriptions
CREATE POLICY "Master can view all subscriptions" ON subscriptions
    FOR SELECT USING (true);

-- Users can see their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (email = auth.jwt() ->> 'email');

-- Users can see their own tickets
CREATE POLICY "Users can view own tickets" ON support_tickets
    FOR SELECT USING (user_id = auth.uid());

-- Users can create their own tickets
CREATE POLICY "Users can create own tickets" ON support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Users can see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (user_id = auth.uid());

-- 11. Insert master account
INSERT INTO users (email, plan, is_active) 
VALUES ('kennethoswin289@gmail.com', 'master', TRUE)
ON CONFLICT (email) DO UPDATE SET plan = 'master', is_active = TRUE;

-- 12. Insert some sample data for testing
INSERT INTO users (email, plan, is_active) VALUES 
('user1@example.com', 'free', TRUE),
('user2@example.com', 'pro', TRUE),
('user3@example.com', 'free', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert sample tickets
INSERT INTO support_tickets (subject, description, priority, status, user_id, user_email) VALUES 
('Login Issue', 'Cannot login to my account', 'high', 'open', (SELECT id FROM users WHERE email = 'user1@example.com'), 'user1@example.com'),
('Feature Request', 'Need dark mode option', 'medium', 'open', (SELECT id FROM users WHERE email = 'user2@example.com'), 'user2@example.com'),
('Bug Report', 'App crashes on mobile', 'urgent', 'in_progress', (SELECT id FROM users WHERE email = 'user3@example.com'), 'user3@example.com')
ON CONFLICT DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message) VALUES 
((SELECT id FROM users WHERE email = 'user1@example.com'), 'ticket_created', 'Ticket Created', 'Your support ticket has been created'),
((SELECT id FROM users WHERE email = 'user2@example.com'), 'plan_updated', 'Plan Updated', 'Your plan has been upgraded to Pro'),
((SELECT id FROM users WHERE email = 'user3@example.com'), 'alert_triggered', 'Alert Triggered', 'Your stock alert has been triggered')
ON CONFLICT DO NOTHING;
`;

async function setupDatabase() {
  console.log('🗄️ Setting up database...');
  
  try {
    // Execute the setup SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: setupSQL });
    
    if (error) {
      console.error('❌ Database setup failed:', error.message);
      return false;
    }
    
    console.log('✅ Database setup completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    return false;
  }
}

// Run the setup
setupDatabase().then(success => {
  if (success) {
    console.log('🎉 Database is ready for testing!');
    process.exit(0);
  } else {
    console.log('💥 Database setup failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Setup crashed:', error);
  process.exit(1);
});
