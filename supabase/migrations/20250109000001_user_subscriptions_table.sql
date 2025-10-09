-- Create user_subscriptions table for subscription management
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended', 'pending')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  is_trial BOOLEAN DEFAULT false,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  cancellation_date TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  payment_method TEXT DEFAULT 'Razorpay',
  last_payment_date TIMESTAMP WITH TIME ZONE,
  next_payment_amount DECIMAL(18,6),
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_auto_renew ON user_subscriptions(auto_renew);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all subscriptions" ON user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE user_subscriptions IS 'User subscription management with Netflix-style features';
COMMENT ON COLUMN user_subscriptions.status IS 'Subscription status: active, cancelled, expired, suspended, pending';
COMMENT ON COLUMN user_subscriptions.auto_renew IS 'Whether subscription auto-renews';
COMMENT ON COLUMN user_subscriptions.is_trial IS 'Whether this is a trial subscription';
COMMENT ON COLUMN user_subscriptions.cancellation_date IS 'When subscription was cancelled';
COMMENT ON COLUMN user_subscriptions.cancellation_reason IS 'Reason for cancellation';
