-- Create day_change_events table for tracking market day changes
CREATE TABLE IF NOT EXISTS day_change_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market TEXT NOT NULL,
  date DATE NOT NULL,
  previous_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_day_change_events_market ON day_change_events(market);
CREATE INDEX IF NOT EXISTS idx_day_change_events_date ON day_change_events(date);
CREATE INDEX IF NOT EXISTS idx_day_change_events_status ON day_change_events(status);
CREATE INDEX IF NOT EXISTS idx_day_change_events_created_at ON day_change_events(created_at);

-- Create unique constraint to prevent duplicate day change events
CREATE UNIQUE INDEX IF NOT EXISTS idx_day_change_events_market_date 
ON day_change_events(market, date);

-- Enable RLS
ALTER TABLE day_change_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Service role can manage all day change events" ON day_change_events
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE day_change_events IS 'Tracks market day changes for ML prediction refresh and data updates';
COMMENT ON COLUMN day_change_events.market IS 'Market identifier (US, IN, GB, etc.)';
COMMENT ON COLUMN day_change_events.date IS 'Trading date for the market';
COMMENT ON COLUMN day_change_events.previous_date IS 'Previous trading date';
COMMENT ON COLUMN day_change_events.status IS 'Processing status of the day change event';
COMMENT ON COLUMN day_change_events.error_message IS 'Error message if processing failed';
