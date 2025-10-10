-- Comprehensive Logging System
-- This migration creates tables for detailed logging and audit trail

-- Application logs
CREATE TABLE IF NOT EXISTS application_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
    message TEXT NOT NULL,
    context JSONB,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trail
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email TEXT,
    ip_address INET,
    user_agent TEXT,
    changes JSONB,
    previous_values JSONB,
    new_values JSONB,
    reason TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance logs
CREATE TABLE IF NOT EXISTS performance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in milliseconds
    status_code INTEGER NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    request_size INTEGER,
    response_size INTEGER,
    database_queries INTEGER,
    cache_hits INTEGER,
    cache_misses INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error logs
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email TEXT,
    ip_address INET,
    user_agent TEXT,
    endpoint TEXT,
    method TEXT,
    request_body JSONB,
    response_body JSONB,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage logs
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER NOT NULL, -- in milliseconds
    request_size INTEGER,
    response_size INTEGER,
    ip_address INET,
    user_agent TEXT,
    rate_limit_remaining INTEGER,
    rate_limit_reset TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health logs
CREATE TABLE IF NOT EXISTS system_health_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    component TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'down')),
    metrics JSONB,
    alerts JSONB,
    uptime_seconds INTEGER,
    memory_usage DECIMAL(5,2),
    cpu_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    network_latency INTEGER,
    database_connections INTEGER,
    active_users INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON application_logs(level);
CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON application_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_application_logs_context_user_id ON application_logs((context->>'userId'));

CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_audit_trail_resource ON audit_trail(resource);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);

CREATE INDEX IF NOT EXISTS idx_performance_logs_endpoint ON performance_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_logs_method ON performance_logs(method);
CREATE INDEX IF NOT EXISTS idx_performance_logs_duration ON performance_logs(duration);
CREATE INDEX IF NOT EXISTS idx_performance_logs_status_code ON performance_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_performance_logs_timestamp ON performance_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_timestamp ON api_usage_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_system_health_logs_component ON system_health_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_status ON system_health_logs(status);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_timestamp ON system_health_logs(timestamp);

-- RLS policies
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view application logs
CREATE POLICY "Only admins can view application logs" ON application_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Only admins can view audit trail
CREATE POLICY "Only admins can view audit trail" ON audit_trail
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Only admins can view performance logs
CREATE POLICY "Only admins can view performance logs" ON performance_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Only admins can view error logs
CREATE POLICY "Only admins can view error logs" ON error_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Users can view their own API usage logs
CREATE POLICY "Users can view own API usage logs" ON api_usage_logs
    FOR SELECT USING (user_id = auth.uid());

-- Only admins can view system health logs
CREATE POLICY "Only admins can view system health logs" ON system_health_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Functions for logging analytics
CREATE OR REPLACE FUNCTION get_logging_analytics()
RETURNS TABLE (
    total_logs BIGINT,
    total_audit_entries BIGINT,
    total_performance_logs BIGINT,
    total_error_logs BIGINT,
    logs_by_level JSONB,
    recent_activity_24h BIGINT,
    avg_response_time DECIMAL(10,2),
    error_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM application_logs) as total_logs,
        (SELECT COUNT(*) FROM audit_trail) as total_audit_entries,
        (SELECT COUNT(*) FROM performance_logs) as total_performance_logs,
        (SELECT COUNT(*) FROM error_logs) as total_error_logs,
        (SELECT jsonb_object_agg(level, count) FROM (
            SELECT level, COUNT(*) as count 
            FROM application_logs 
            GROUP BY level
        ) t) as logs_by_level,
        (SELECT COUNT(*) FROM application_logs WHERE timestamp > NOW() - INTERVAL '24 hours') as recent_activity_24h,
        (SELECT AVG(duration) FROM performance_logs) as avg_response_time,
        (SELECT ROUND(
            (COUNT(*) FILTER (WHERE status_code >= 400)::DECIMAL / COUNT(*)) * 100, 
            2
        ) FROM performance_logs) as error_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete application logs older than specified days
    DELETE FROM application_logs WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete audit trail older than specified days
    DELETE FROM audit_trail WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    -- Delete performance logs older than specified days
    DELETE FROM performance_logs WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    -- Delete error logs older than specified days (keep resolved errors longer)
    DELETE FROM error_logs WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep AND resolved = true;
    
    -- Delete API usage logs older than specified days
    DELETE FROM api_usage_logs WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    -- Delete system health logs older than specified days
    DELETE FROM system_health_logs WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_statistics()
RETURNS TABLE (
    total_errors BIGINT,
    unresolved_errors BIGINT,
    errors_by_severity JSONB,
    errors_by_type JSONB,
    recent_errors_24h BIGINT,
    avg_resolution_time DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_errors,
        COUNT(*) FILTER (WHERE resolved = false) as unresolved_errors,
        (SELECT jsonb_object_agg(severity, count) FROM (
            SELECT severity, COUNT(*) as count 
            FROM error_logs 
            GROUP BY severity
        ) t) as errors_by_severity,
        (SELECT jsonb_object_agg(error_type, count) FROM (
            SELECT error_type, COUNT(*) as count 
            FROM error_logs 
            GROUP BY error_type
        ) t) as errors_by_type,
        COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours') as recent_errors_24h,
        AVG(EXTRACT(EPOCH FROM (resolved_at - timestamp))) as avg_resolution_time
    FROM error_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get performance statistics
CREATE OR REPLACE FUNCTION get_performance_statistics()
RETURNS TABLE (
    total_requests BIGINT,
    avg_response_time DECIMAL(10,2),
    slowest_endpoints JSONB,
    status_code_distribution JSONB,
    recent_requests_24h BIGINT,
    error_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_requests,
        AVG(duration) as avg_response_time,
        (SELECT jsonb_object_agg(endpoint, avg_duration) FROM (
            SELECT endpoint, AVG(duration) as avg_duration 
            FROM performance_logs 
            GROUP BY endpoint 
            ORDER BY avg_duration DESC 
            LIMIT 10
        ) t) as slowest_endpoints,
        (SELECT jsonb_object_agg(status_code::text, count) FROM (
            SELECT status_code, COUNT(*) as count 
            FROM performance_logs 
            GROUP BY status_code
        ) t) as status_code_distribution,
        COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours') as recent_requests_24h,
        ROUND(
            (COUNT(*) FILTER (WHERE status_code >= 400)::DECIMAL / COUNT(*)) * 100, 
            2
        ) as error_rate
    FROM performance_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_logging_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_logs(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_error_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_statistics() TO authenticated;
