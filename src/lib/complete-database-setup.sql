-- COMPLETE DATABASE SETUP FOR MASTER ACCOUNT
-- Run this in your Supabase SQL Editor

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

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- 5. Create update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at 
    BEFORE UPDATE ON support_tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 8. Create policies
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

-- 9. Insert master account
INSERT INTO users (email, plan, is_active) 
VALUES ('kennethoswin289@gmail.com', 'master', TRUE)
ON CONFLICT (email) DO UPDATE SET plan = 'master', is_active = TRUE;

-- 10. Insert some sample data for testing
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
