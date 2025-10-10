 -- Create payment_states table for payment flow management
CREATE TABLE IF NOT EXISTS payment_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled', 'expired')),
  plan TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_states_user_id ON payment_states(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_states_order_id ON payment_states(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_states_status ON payment_states(status);
CREATE INDEX IF NOT EXISTS idx_payment_states_expires_at ON payment_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_states_created_at ON payment_states(created_at);

-- Enable RLS
ALTER TABLE payment_states ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own payment states" ON payment_states
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all payment states" ON payment_states
  FOR ALL USING (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE TRIGGER update_payment_states_updated_at BEFORE UPDATE ON payment_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired payments
CREATE OR REPLACE FUNCTION cleanup_expired_payment_states()
RETURNS void AS $$
BEGIN
  -- Mark expired pending payments as expired
  UPDATE payment_states 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' 
  AND expires_at < NOW();
  
  -- Delete very old expired payments (older than 7 days)
  DELETE FROM payment_states 
  WHERE status = 'expired' 
  AND updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically clean up expired payments
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_payments()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up expired payments when new ones are inserted
  PERFORM cleanup_expired_payment_states();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_expired_payments_trigger
  AFTER INSERT ON payment_states
  FOR EACH ROW EXECUTE FUNCTION trigger_cleanup_expired_payments();

-- Add comments
COMMENT ON TABLE payment_states IS 'Payment flow state management for Razorpay integration';
COMMENT ON COLUMN payment_states.status IS 'Current status of the payment: pending, success, failed, cancelled, expired';
COMMENT ON COLUMN payment_states.expires_at IS 'When the payment state expires (typically 10 minutes)';
COMMENT ON COLUMN payment_states.error_message IS 'Error message if payment failed';
