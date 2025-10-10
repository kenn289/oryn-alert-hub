-- Enhanced Payment Verification System
-- This migration creates tables for fraud detection, security monitoring, and enhanced payment verification

-- Fraud attempts tracking
CREATE TABLE IF NOT EXISTS fraud_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    order_id TEXT NOT NULL,
    payment_id TEXT,
    risk_score DECIMAL(3,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 1),
    fraud_checks JSONB NOT NULL,
    user_agent TEXT,
    ip_address INET,
    device_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security violations tracking
CREATE TABLE IF NOT EXISTS security_violations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    order_id TEXT,
    payment_id TEXT,
    violation_type TEXT NOT NULL,
    user_agent TEXT,
    ip_address INET,
    device_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment failures tracking
CREATE TABLE IF NOT EXISTS payment_failures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    order_id TEXT NOT NULL,
    payment_id TEXT,
    error_message TEXT NOT NULL,
    user_agent TEXT,
    ip_address INET,
    device_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System errors tracking
CREATE TABLE IF NOT EXISTS system_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    order_id TEXT,
    payment_id TEXT,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    user_agent TEXT,
    ip_address INET,
    device_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment verification logs
CREATE TABLE IF NOT EXISTS payment_verification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL,
    payment_id TEXT,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('success', 'failed', 'fraud_detected', 'security_violation')),
    risk_score DECIMAL(3,2),
    fraud_checks JSONB,
    verification_steps JSONB,
    processing_time_ms INTEGER,
    user_agent TEXT,
    ip_address INET,
    device_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced payment states with additional security fields
ALTER TABLE payment_states ADD COLUMN IF NOT EXISTS risk_score DECIMAL(3,2);
ALTER TABLE payment_states ADD COLUMN IF NOT EXISTS fraud_checks JSONB;
ALTER TABLE payment_states ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE payment_states ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE payment_states ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE payment_states ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0;
ALTER TABLE payment_states ADD COLUMN IF NOT EXISTS last_verification_attempt TIMESTAMP WITH TIME ZONE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fraud_attempts_user_id ON fraud_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_attempts_created_at ON fraud_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_fraud_attempts_risk_score ON fraud_attempts(risk_score);

CREATE INDEX IF NOT EXISTS idx_security_violations_user_id ON security_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_security_violations_violation_type ON security_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_security_violations_created_at ON security_violations(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_failures_user_id ON payment_failures(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_failures_created_at ON payment_failures(created_at);

CREATE INDEX IF NOT EXISTS idx_system_errors_user_id ON system_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_system_errors_created_at ON system_errors(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_user_id ON payment_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_status ON payment_verification_logs(verification_status);
CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_created_at ON payment_verification_logs(created_at);

-- RLS policies for security
ALTER TABLE fraud_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verification_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view fraud attempts and security violations
CREATE POLICY "Only admins can view fraud attempts" ON fraud_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

CREATE POLICY "Only admins can view security violations" ON security_violations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

CREATE POLICY "Only admins can view payment failures" ON payment_failures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

CREATE POLICY "Only admins can view system errors" ON system_errors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

CREATE POLICY "Only admins can view verification logs" ON payment_verification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Users can view their own verification logs
CREATE POLICY "Users can view their own verification logs" ON payment_verification_logs
    FOR SELECT USING (user_id = auth.uid());

-- Functions for analytics
CREATE OR REPLACE FUNCTION get_fraud_analytics()
RETURNS TABLE (
    total_attempts BIGINT,
    high_risk_attempts BIGINT,
    avg_risk_score DECIMAL(3,2),
    top_violation_types TEXT[],
    recent_attempts_24h BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE risk_score > 0.7) as high_risk_attempts,
        ROUND(AVG(risk_score), 2) as avg_risk_score,
        ARRAY_AGG(DISTINCT violation_type) FILTER (WHERE violation_type IS NOT NULL) as top_violation_types,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_attempts_24h
    FROM fraud_attempts fa
    LEFT JOIN security_violations sv ON fa.user_id = sv.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payment verification statistics
CREATE OR REPLACE FUNCTION get_payment_verification_stats()
RETURNS TABLE (
    total_verifications BIGINT,
    successful_verifications BIGINT,
    failed_verifications BIGINT,
    fraud_detected BIGINT,
    avg_processing_time DECIMAL(10,2),
    success_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_verifications,
        COUNT(*) FILTER (WHERE verification_status = 'success') as successful_verifications,
        COUNT(*) FILTER (WHERE verification_status = 'failed') as failed_verifications,
        COUNT(*) FILTER (WHERE verification_status = 'fraud_detected') as fraud_detected,
        ROUND(AVG(processing_time_ms), 2) as avg_processing_time,
        ROUND(
            (COUNT(*) FILTER (WHERE verification_status = 'success')::DECIMAL / COUNT(*)) * 100, 
            2
        ) as success_rate
    FROM payment_verification_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old logs (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_verification_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete fraud attempts older than 90 days
    DELETE FROM fraud_attempts WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete security violations older than 90 days
    DELETE FROM security_violations WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete payment failures older than 30 days
    DELETE FROM payment_failures WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete system errors older than 30 days
    DELETE FROM system_errors WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete verification logs older than 180 days
    DELETE FROM payment_verification_logs WHERE created_at < NOW() - INTERVAL '180 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for admin dashboard
CREATE OR REPLACE VIEW admin_payment_security_dashboard AS
SELECT 
    'fraud_attempts' as metric_type,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
    ROUND(AVG(risk_score), 2) as avg_risk_score
FROM fraud_attempts
UNION ALL
SELECT 
    'security_violations' as metric_type,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
    NULL as avg_risk_score
FROM security_violations
UNION ALL
SELECT 
    'payment_failures' as metric_type,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
    NULL as avg_risk_score
FROM payment_failures
UNION ALL
SELECT 
    'system_errors' as metric_type,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
    NULL as avg_risk_score
FROM system_errors;

-- Grant permissions
GRANT SELECT ON admin_payment_security_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_fraud_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_verification_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_verification_logs() TO authenticated;
