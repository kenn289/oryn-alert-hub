-- URGENT DATABASE FIX - Copy and paste this into Supabase SQL Editor
-- This will fix the "Could not find the table 'public.notifications'" error

-- 1. Create the missing notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('ticket_created', 'ticket_resolved', 'user_joined', 'alert_triggered', 'plan_updated')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create users table if missing
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'master')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- 3. Create support_tickets table if missing
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

-- 4. Create subscriptions table if missing
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

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);

-- 6. Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 7. Create basic policies (allow all for now)
DROP POLICY IF EXISTS "Allow all operations on notifications" ON notifications;
CREATE POLICY "Allow all operations on notifications" ON notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on support_tickets" ON support_tickets;
CREATE POLICY "Allow all operations on support_tickets" ON support_tickets FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on subscriptions" ON subscriptions;
CREATE POLICY "Allow all operations on subscriptions" ON subscriptions FOR ALL USING (true);

-- 8. Insert master account
INSERT INTO users (email, plan, is_active) 
VALUES ('kennethoswin289@gmail.com', 'master', TRUE)
ON CONFLICT (email) DO UPDATE SET plan = 'master', is_active = TRUE;

-- 9. Insert sample notifications for the current user
INSERT INTO notifications (user_id, type, title, message) VALUES 
('0c728692-f22b-4eea-91cc-f9d075996d21', 'ticket_created', 'Welcome!', 'Welcome to Oryn Alert Hub'),
('0c728692-f22b-4eea-91cc-f9d075996d21', 'alert_triggered', 'Stock Alert', 'Your stock alert has been triggered'),
('0c728692-f22b-4eea-91cc-f9d075996d21', 'plan_updated', 'Plan Updated', 'Your plan has been updated')
ON CONFLICT DO NOTHING;

-- 10. Insert sample support tickets
INSERT INTO support_tickets (subject, description, priority, status, user_id, user_email) VALUES 
('Welcome Ticket', 'Welcome to Oryn Alert Hub support', 'low', 'open', '0c728692-f22b-4eea-91cc-f9d075996d21', 'kennethoswin289@gmail.com'),
('Feature Request', 'Need dark mode option', 'medium', 'open', '0c728692-f22b-4eea-91cc-f9d075996d21', 'kennethoswin289@gmail.com')
ON CONFLICT DO NOTHING;

-- 11. Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'users', 'support_tickets', 'subscriptions')
ORDER BY table_name;
