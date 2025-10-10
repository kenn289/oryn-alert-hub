-- Comprehensive Security System
-- This migration creates tables for comprehensive security monitoring and protection

-- Security events tracking
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('login_attempt', 'login_success', 'login_failure', 'suspicious_activity', 'rate_limit_exceeded', 'security_violation')),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email TEXT,
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint TEXT,
    geolocation JSONB,
    risk_score DECIMAL(3,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 1),
    details TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    endpoint TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    first_request TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_request TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys management
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint TEXT,
    geolocation JSONB,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IP whitelist/blacklist
CREATE TABLE IF NOT EXISTS ip_access_control (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    ip_range CIDR,
    type TEXT NOT NULL CHECK (type IN ('whitelist', 'blacklist')),
    reason TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device fingerprinting
CREATE TABLE IF NOT EXISTS device_fingerprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    fingerprint_hash TEXT NOT NULL,
    device_info JSONB,
    is_trusted BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security policies
CREATE TABLE IF NOT EXISTS security_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    rules JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(type);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_risk_score ON security_events(risk_score);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_request ON rate_limits(last_request);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_ip_access_control_ip_address ON ip_access_control(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_access_control_type ON ip_access_control(type);
CREATE INDEX IF NOT EXISTS idx_ip_access_control_is_active ON ip_access_control(is_active);

CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_fingerprint_hash ON device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_is_trusted ON device_fingerprints(is_trusted);

-- RLS policies
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Only admins can view security events" ON security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Only admins can view rate limits
CREATE POLICY "Only admins can view rate limits" ON rate_limits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Users can view their own API keys
CREATE POLICY "Users can view own API keys" ON api_keys
    FOR SELECT USING (user_id = auth.uid());

-- Users can manage their own API keys
CREATE POLICY "Users can manage own API keys" ON api_keys
    FOR ALL USING (user_id = auth.uid());

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

-- Users can manage their own sessions
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (user_id = auth.uid());

-- Users can view their own device fingerprints
CREATE POLICY "Users can view own device fingerprints" ON device_fingerprints
    FOR SELECT USING (user_id = auth.uid());

-- Only admins can view IP access control
CREATE POLICY "Only admins can view IP access control" ON ip_access_control
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Only admins can view security policies
CREATE POLICY "Only admins can view security policies" ON security_policies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Functions for security analytics
CREATE OR REPLACE FUNCTION get_security_analytics()
RETURNS TABLE (
    total_events BIGINT,
    high_risk_events BIGINT,
    avg_risk_score DECIMAL(3,2),
    top_event_types TEXT[],
    recent_events_24h BIGINT,
    blocked_ips BIGINT,
    active_sessions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE risk_score > 0.7) as high_risk_events,
        ROUND(AVG(risk_score), 2) as avg_risk_score,
        ARRAY_AGG(DISTINCT type) FILTER (WHERE type IS NOT NULL) as top_event_types,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_events_24h,
        (SELECT COUNT(*) FROM ip_access_control WHERE type = 'blacklist' AND is_active = true) as blocked_ips,
        (SELECT COUNT(*) FROM user_sessions WHERE is_active = true) as active_sessions
    FROM security_events;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old security data
CREATE OR REPLACE FUNCTION cleanup_old_security_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete security events older than 90 days
    DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete rate limits older than 7 days
    DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- Delete expired sessions
    DELETE FROM user_sessions WHERE expires_at < NOW();
    
    -- Delete old device fingerprints (keep last 30 days)
    DELETE FROM device_fingerprints WHERE last_seen < NOW() - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(ip_to_check INET)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM ip_access_control 
        WHERE (ip_address = ip_to_check OR ip_to_check <<= ip_range)
        AND type = 'blacklist' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user risk score
CREATE OR REPLACE FUNCTION get_user_risk_score(user_id_param UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    risk_score DECIMAL(3,2);
BEGIN
    SELECT AVG(risk_score) INTO risk_score
    FROM security_events 
    WHERE user_id = user_id_param 
    AND created_at > NOW() - INTERVAL '7 days';
    
    RETURN COALESCE(risk_score, 0.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default security policies
INSERT INTO security_policies (name, description, rules) VALUES
('default_rate_limit', 'Default rate limiting policy', '{"window": 60, "max_requests": 60, "block_duration": 300}'),
('login_protection', 'Login attempt protection', '{"max_attempts": 5, "lockout_duration": 900, "require_2fa": false}'),
('session_security', 'Session security policy', '{"timeout": 86400, "require_reauth": false, "max_concurrent": 3}'),
('ip_protection', 'IP address protection', '{"enable_whitelist": false, "enable_blacklist": true, "auto_block_threshold": 0.8}');

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_security_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_security_data() TO authenticated;
GRANT EXECUTE ON FUNCTION is_ip_blocked(INET) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_risk_score(UUID) TO authenticated;
