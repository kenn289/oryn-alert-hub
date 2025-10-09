-- Create payment_orders table for Razorpay order tracking
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'cancelled')),
  payment_id TEXT,
  invoice_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);

-- Enable RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own payment orders" ON payment_orders
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all payment orders" ON payment_orders
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE payment_orders IS 'Razorpay payment order tracking';
COMMENT ON COLUMN payment_orders.order_id IS 'Razorpay order ID';
COMMENT ON COLUMN payment_orders.payment_id IS 'Razorpay payment ID (set when payment is successful)';
COMMENT ON COLUMN payment_orders.invoice_id IS 'Associated invoice ID';
