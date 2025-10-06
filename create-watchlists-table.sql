-- Create watchlist table for persistent storage
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_ticker ON watchlists(ticker);
CREATE INDEX IF NOT EXISTS idx_watchlists_market ON watchlists(market);

-- Add RLS (Row Level Security) policies
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

-- Policy for watchlists - users can only see their own watchlist items
CREATE POLICY "Users can manage their own watchlist items" ON watchlists
  FOR ALL USING (auth.uid()::text = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_watchlists_updated_at BEFORE UPDATE ON watchlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
