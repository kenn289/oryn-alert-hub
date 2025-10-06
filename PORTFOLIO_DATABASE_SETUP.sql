-- PORTFOLIO, WATCHLIST, AND ALERTS DATABASE SETUP
-- This script creates tables for persistent storage of user data

-- 1. Create portfolio_items table
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  shares DECIMAL(15,6) NOT NULL,
  avg_price DECIMAL(15,6) NOT NULL,
  current_price DECIMAL(15,6) NOT NULL,
  total_value DECIMAL(15,6) NOT NULL,
  gain_loss DECIMAL(15,6) NOT NULL,
  gain_loss_percent DECIMAL(8,4) NOT NULL,
  market VARCHAR(10) NOT NULL DEFAULT 'US',
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  exchange VARCHAR(50),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create watchlist_items table
CREATE TABLE IF NOT EXISTS watchlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(15,6) DEFAULT 0,
  change DECIMAL(15,6) DEFAULT 0,
  change_percent DECIMAL(8,4) DEFAULT 0,
  market VARCHAR(10) NOT NULL DEFAULT 'US',
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ticker, market)
);

-- 3. Create stock_alerts table
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('price_above', 'price_below', 'percent_change', 'volume_spike')),
  target_value DECIMAL(15,6) NOT NULL,
  current_value DECIMAL(15,6),
  is_triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP WITH TIME ZONE,
  market VARCHAR(10) NOT NULL DEFAULT 'US',
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create user_preferences table for settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  default_currency VARCHAR(3) DEFAULT 'USD',
  default_market VARCHAR(10) DEFAULT 'US',
  timezone VARCHAR(50) DEFAULT 'UTC',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_alerts BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_items_user_id ON portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_ticker ON portfolio_items(ticker);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_user_id ON watchlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_ticker ON watchlist_items(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_user_id ON stock_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_ticker ON stock_alerts(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_triggered ON stock_alerts(is_triggered);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 6. Create update triggers
CREATE TRIGGER update_portfolio_items_updated_at
    BEFORE UPDATE ON portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlist_items_updated_at
    BEFORE UPDATE ON watchlist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_alerts_updated_at
    BEFORE UPDATE ON stock_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable Row Level Security
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can manage own portfolio" ON portfolio_items;
DROP POLICY IF EXISTS "Users can manage own watchlist" ON watchlist_items;
DROP POLICY IF EXISTS "Users can manage own alerts" ON stock_alerts;
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;

-- Create new policies
CREATE POLICY "Users can manage own portfolio" ON portfolio_items FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own watchlist" ON watchlist_items FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own alerts" ON stock_alerts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (user_id = auth.uid());

-- 9. Create default user preferences for existing users
INSERT INTO user_preferences (user_id, default_currency, default_market, timezone, notifications_enabled, email_alerts)
SELECT 
  id, 
  'USD', 
  'US', 
  'UTC', 
  TRUE, 
  TRUE
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_preferences);

-- 10. Clean up duplicate data (as requested)
-- Remove duplicate users with same email, keeping the most recent one
WITH duplicate_users AS (
  SELECT email, MAX(created_at) as latest_created
  FROM users 
  GROUP BY email 
  HAVING COUNT(*) > 1
)
DELETE FROM users 
WHERE (email, created_at) NOT IN (
  SELECT email, latest_created 
  FROM duplicate_users
);

-- 11. Verify tables were created
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('portfolio_items', 'watchlist_items', 'stock_alerts', 'user_preferences')
ORDER BY table_name, ordinal_position;

-- 12. Show table counts
SELECT 
  'portfolio_items' as table_name, COUNT(*) as count FROM portfolio_items
UNION ALL
SELECT 
  'watchlist_items' as table_name, COUNT(*) as count FROM watchlist_items
UNION ALL
SELECT 
  'stock_alerts' as table_name, COUNT(*) as count FROM stock_alerts
UNION ALL
SELECT 
  'user_preferences' as table_name, COUNT(*) as count FROM user_preferences;
