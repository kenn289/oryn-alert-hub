-- Create subscription_events table for audit trail
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'created', 'cancelled', 'renewed', 'expired'
  subscription_id UUID,
  plan TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Store additional event data
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

-- Add RLS policy
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Policy for subscription_events - users can only see their own events
CREATE POLICY "Users can view their own subscription events" ON subscription_events
  FOR ALL USING (auth.uid()::text = user_id);

