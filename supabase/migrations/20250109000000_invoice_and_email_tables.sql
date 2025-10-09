-- Create invoices table for comprehensive payment tracking
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_method TEXT DEFAULT 'Razorpay',
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(18,6) NOT NULL,
  tax DECIMAL(18,6) NOT NULL,
  total DECIMAL(18,6) NOT NULL
);

-- Create email_logs table for email tracking
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,
  invoice_id TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced', 'delivered')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Create payment_scenarios table for tracking different payment types
CREATE TABLE IF NOT EXISTS payment_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  scenario_type TEXT NOT NULL CHECK (scenario_type IN ('new_subscription', 'renewal', 'upgrade', 'downgrade', 'retry', 'refund')),
  plan TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  currency TEXT DEFAULT 'INR',
  previous_plan TEXT,
  retry_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  invoice_id TEXT REFERENCES invoices(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_invoice_id ON email_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

CREATE INDEX IF NOT EXISTS idx_payment_scenarios_user_id ON payment_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_scenarios_type ON payment_scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_payment_scenarios_status ON payment_scenarios(status);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices
CREATE POLICY "Users can view their own invoices" ON invoices
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all invoices" ON invoices
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for email_logs
CREATE POLICY "Users can view their own email logs" ON email_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all email logs" ON email_logs
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for payment_scenarios
CREATE POLICY "Users can view their own payment scenarios" ON payment_scenarios
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all payment scenarios" ON payment_scenarios
  FOR ALL USING (auth.role() = 'service_role');

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE invoices IS 'Comprehensive invoice tracking for all payment scenarios';
COMMENT ON TABLE email_logs IS 'Email delivery tracking and analytics';
COMMENT ON TABLE payment_scenarios IS 'Payment scenario tracking for Netflix-style payment handling';

COMMENT ON COLUMN invoices.status IS 'Invoice status: pending, paid, failed, cancelled, refunded';
COMMENT ON COLUMN invoices.items IS 'JSON array of invoice line items';
COMMENT ON COLUMN email_logs.email_type IS 'Type of email: invoice, payment_confirmation, payment_failure, etc.';
COMMENT ON COLUMN payment_scenarios.scenario_type IS 'Payment scenario type: new_subscription, renewal, upgrade, downgrade, retry, refund';
