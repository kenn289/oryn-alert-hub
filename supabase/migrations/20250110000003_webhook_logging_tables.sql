-- Create webhook_events table for comprehensive webhook logging
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  order_id TEXT,
  payment_id TEXT,
  user_id TEXT,
  amount DECIMAL(18,6),
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'completed', 'failed')),
  raw_payload JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create revenue_logs table for detailed revenue tracking
CREATE TABLE IF NOT EXISTS revenue_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  currency TEXT DEFAULT 'INR',
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
  source TEXT NOT NULL DEFAULT 'webhook' CHECK (source IN ('webhook', 'manual', 'api')),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id ON webhook_events(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_id ON webhook_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id ON webhook_events(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

CREATE INDEX IF NOT EXISTS idx_revenue_logs_order_id ON revenue_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_revenue_logs_payment_id ON revenue_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_revenue_logs_user_id ON revenue_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_logs_status ON revenue_logs(status);
CREATE INDEX IF NOT EXISTS idx_revenue_logs_source ON revenue_logs(source);
CREATE INDEX IF NOT EXISTS idx_revenue_logs_created_at ON revenue_logs(created_at);

-- Enable RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook_events
CREATE POLICY "Service role can manage all webhook events" ON webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for revenue_logs
CREATE POLICY "Service role can manage all revenue logs" ON revenue_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Create triggers for updated_at
CREATE TRIGGER update_webhook_events_updated_at BEFORE UPDATE ON webhook_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_logs_updated_at BEFORE UPDATE ON revenue_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old webhook events
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  -- Delete webhook events older than 30 days
  DELETE FROM webhook_events 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete revenue logs older than 1 year
  DELETE FROM revenue_logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE webhook_events IS 'Comprehensive webhook event logging for debugging and audit';
COMMENT ON TABLE revenue_logs IS 'Detailed revenue transaction tracking with status management';
COMMENT ON COLUMN webhook_events.raw_payload IS 'Complete webhook payload for debugging';
COMMENT ON COLUMN revenue_logs.source IS 'Source of the revenue transaction: webhook, manual, api';
COMMENT ON COLUMN revenue_logs.status IS 'Transaction status: pending, confirmed, failed, refunded';
