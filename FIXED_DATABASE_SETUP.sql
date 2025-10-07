-- ============================================
-- Oryn Alert Hub Database Setup (Fixed & Safe)
-- No conflicts, no errors, just works
-- Handles existing triggers gracefully
-- ============================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'master')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  subscription_status TEXT DEFAULT 'active',
  subscription_id TEXT,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Portfolios
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  shares DECIMAL(18,6) NOT NULL CHECK (shares > 0),
  avg_price DECIMAL(18,6) NOT NULL CHECK (avg_price >= 0),
  current_price DECIMAL(18,6) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  exchange TEXT,
  market TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- 3. Watchlists
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(12,4) DEFAULT 0,
  change DECIMAL(12,4) DEFAULT 0,
  change_percent DECIMAL(8,4) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  exchange TEXT,
  market TEXT,
  sector TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- 4. User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  currency_preference TEXT DEFAULT 'USD',
  theme_preference TEXT DEFAULT 'system',
  notification_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT DEFAULT 'general',
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes (Performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Drop existing policies if they exist (to avoid conflicts)
-- ============================================
DROP POLICY IF EXISTS "Master users can see all users" ON users;
DROP POLICY IF EXISTS "Users can manage their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can manage their own watchlists" ON watchlists;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;

-- ============================================
-- Policies (Simple & Safe)
-- ============================================

-- Master user full access
CREATE POLICY "Master users can see all users" ON users
  FOR ALL USING (auth.jwt() ->> 'email' = 'kennethoswin289@gmail.com');

-- Portfolios
CREATE POLICY "Users can manage their own portfolios" ON portfolios
  FOR ALL USING (user_id::uuid = auth.uid());

-- Watchlists
CREATE POLICY "Users can manage their own watchlists" ON watchlists
  FOR ALL USING (user_id::uuid = auth.uid());

-- User Preferences
CREATE POLICY "Users can manage their own preferences" ON user_preferences
  FOR ALL USING (user_id::uuid = auth.uid());

-- Support Tickets (master override)
CREATE POLICY "Users can manage their own tickets" ON support_tickets
  FOR ALL USING (
    user_id::uuid = auth.uid() OR
    auth.jwt() ->> 'email' = 'kennethoswin289@gmail.com'
  );

-- Notifications
CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL USING (user_id::uuid = auth.uid());

-- ============================================
-- Function for updated_at auto-update
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Drop existing triggers if they exist (to avoid conflicts)
-- ============================================
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
DROP TRIGGER IF EXISTS update_watchlists_updated_at ON watchlists;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;

-- ============================================
-- Triggers for updated_at auto-update
-- ============================================
CREATE TRIGGER update_portfolios_updated_at
BEFORE UPDATE ON portfolios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlists_updated_at
BEFORE UPDATE ON watchlists
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sync auth.users → users
-- ============================================
INSERT INTO users (id, email, created_at, last_login, is_active, plan)
SELECT
  id,
  email,
  created_at,
  updated_at,
  true,
  CASE
    WHEN email = 'kennethoswin289@gmail.com' THEN 'master'
    ELSE 'free'
  END
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    last_login = EXCLUDED.last_login,
    is_active = true;

-- ============================================
-- Grants
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
