-- Create subscription_events table for tracking subscription lifecycle events
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

-- Enable RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own subscription events" ON subscription_events
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all subscription events" ON subscription_events
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE subscription_events IS 'Subscription lifecycle event tracking';
COMMENT ON COLUMN subscription_events.event_type IS 'Type of event: activated, cancelled, reactivated, renewed, etc.';
COMMENT ON COLUMN subscription_events.event_data IS 'JSON data associated with the event';
