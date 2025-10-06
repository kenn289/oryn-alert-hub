-- Safe migration to fix user_id schema issues
-- This handles existing objects gracefully

-- Create watchlist table for persistent storage (with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS watchlists_fixed (
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

-- Create indexes for better performance (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_watchlists_fixed_user_id ON watchlists_fixed(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_fixed_ticker ON watchlists_fixed(ticker);
CREATE INDEX IF NOT EXISTS idx_watchlists_fixed_market ON watchlists_fixed(market);

-- Add RLS (Row Level Security) policies (with IF NOT EXISTS)
ALTER TABLE watchlists_fixed ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Users can manage their own watchlist items" ON watchlists_fixed;
CREATE POLICY "Users can manage their own watchlist items" ON watchlists_fixed
  FOR ALL USING (auth.uid()::text = user_id);

-- Function to update updated_at timestamp (CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS update_watchlists_fixed_updated_at ON watchlists_fixed;
CREATE TRIGGER update_watchlists_fixed_updated_at BEFORE UPDATE ON watchlists_fixed
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create portfolios table with correct schema
CREATE TABLE IF NOT EXISTS portfolios_fixed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  shares DECIMAL(18,6) NOT NULL CHECK (shares > 0),
  avg_price DECIMAL(18,6) NOT NULL CHECK (avg_price >= 0),
  current_price DECIMAL(18,6) DEFAULT 0,
  total_value DECIMAL(18,6) DEFAULT 0,
  gain_loss DECIMAL(18,6) DEFAULT 0,
  gain_loss_percent DECIMAL(8,4) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  exchange TEXT,
  market TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_fixed_user_id ON portfolios_fixed(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_fixed_ticker ON portfolios_fixed(ticker);
CREATE INDEX IF NOT EXISTS idx_portfolios_fixed_market ON portfolios_fixed(market);

-- Enable RLS
ALTER TABLE portfolios_fixed ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Users can manage their own portfolio items" ON portfolios_fixed;
CREATE POLICY "Users can manage their own portfolio items" ON portfolios_fixed
  FOR ALL USING (auth.uid()::text = user_id);

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS update_portfolios_fixed_updated_at ON portfolios_fixed;
CREATE TRIGGER update_portfolios_fixed_updated_at BEFORE UPDATE ON portfolios_fixed
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
