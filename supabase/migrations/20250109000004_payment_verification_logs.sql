-- Payment verification logs table for security and audit trail
CREATE TABLE IF NOT EXISTS payment_verification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    verification_status VARCHAR(50) NOT NULL CHECK (verification_status IN ('success', 'failed', 'pending')),
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_user_id ON payment_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_payment_id ON payment_verification_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_order_id ON payment_verification_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_status ON payment_verification_logs(verification_status);
CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_verified_at ON payment_verification_logs(verified_at);

-- Add RLS policies
ALTER TABLE payment_verification_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own verification logs
CREATE POLICY "Users can view own verification logs" ON payment_verification_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can insert verification logs
CREATE POLICY "Service role can insert verification logs" ON payment_verification_logs
    FOR INSERT WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE payment_verification_logs IS 'Audit trail for payment verification attempts';
COMMENT ON COLUMN payment_verification_logs.verification_status IS 'Status of the verification attempt';
COMMENT ON COLUMN payment_verification_logs.ip_address IS 'IP address of the user during verification';
COMMENT ON COLUMN payment_verification_logs.error_message IS 'Error message if verification failed';
