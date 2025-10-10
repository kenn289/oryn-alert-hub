-- Complete System Migration for Oryn Alert Hub
-- This file contains all database migrations for the enhanced stock analysis website
-- Run this file to set up the complete database structure

-- =============================================================================
-- 0. USERS TABLE (REQUIRED FOR FOREIGN KEY REFERENCES)
-- =============================================================================

-- Create users table for user management
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'master', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  subscription_status TEXT DEFAULT 'active',
  subscription_id TEXT,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (id = auth.uid()::uuid);

CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- 1. USER SUBSCRIPTIONS TABLE (REQUIRED FOR RLS POLICIES)
-- =============================================================================

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

-- =============================================================================
-- 2. REFRESH TOKENS TABLE
-- =============================================================================

-- Create refresh tokens table for secure session management
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for refresh tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

-- RLS for refresh tokens
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own refresh tokens
CREATE POLICY "Users can manage own refresh tokens" ON refresh_tokens
    FOR ALL USING (user_id = auth.uid()::uuid);

-- =============================================================================
-- 3. PAYMENT STATES TABLE
-- =============================================================================

-- Create payment states table for enhanced payment tracking
CREATE TABLE IF NOT EXISTS payment_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    payment_id TEXT,
    plan TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('created', 'pending', 'success', 'failed', 'cancelled')),
    error_message TEXT,
    risk_score DECIMAL(3,2),
    fraud_checks JSONB,
    user_agent TEXT,
    ip_address INET,
    device_fingerprint TEXT,
    verification_attempts INTEGER DEFAULT 0,
    last_verification_attempt TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payment states
CREATE INDEX IF NOT EXISTS idx_payment_states_user_id ON payment_states(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_states_order_id ON payment_states(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_states_status ON payment_states(status);
CREATE INDEX IF NOT EXISTS idx_payment_states_created_at ON payment_states(created_at);

-- RLS for payment states
ALTER TABLE payment_states ENABLE ROW LEVEL SECURITY;

-- Users can only access their own payment states
CREATE POLICY "Users can view own payment states" ON payment_states
    FOR SELECT USING (user_id = auth.uid()::uuid);

-- =============================================================================
-- 4. DAY CHANGE EVENTS TABLE
-- =============================================================================

-- Create day change events table for market day tracking
CREATE TABLE IF NOT EXISTS day_change_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    market TEXT NOT NULL,
    timezone TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('day_start', 'day_end', 'market_open', 'market_close')),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Indexes for day change events
CREATE INDEX IF NOT EXISTS idx_day_change_events_market ON day_change_events(market);
CREATE INDEX IF NOT EXISTS idx_day_change_events_processed_at ON day_change_events(processed_at);
CREATE INDEX IF NOT EXISTS idx_day_change_events_event_type ON day_change_events(event_type);

-- =============================================================================
-- 5. WEBHOOK LOGGING TABLES
-- =============================================================================

-- Webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    raw_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processing_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue logs table
CREATE TABLE IF NOT EXISTS revenue_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'failed', 'pending')),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for webhook logging
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_revenue_logs_order_id ON revenue_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_revenue_logs_user_id ON revenue_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_logs_status ON revenue_logs(status);
CREATE INDEX IF NOT EXISTS idx_revenue_logs_confirmed_at ON revenue_logs(confirmed_at);

-- RLS for revenue logs
ALTER TABLE revenue_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own revenue logs
CREATE POLICY "Users can view own revenue logs" ON revenue_logs
    FOR SELECT USING (user_id = auth.uid()::uuid);

-- =============================================================================
-- 6. WATCHLIST PROTECTION TABLES
-- =============================================================================

-- Watchlist backups table
CREATE TABLE IF NOT EXISTS watchlist_backups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    backup_data JSONB NOT NULL,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'automatic', 'before_change')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Watchlist validation logs table
CREATE TABLE IF NOT EXISTS watchlist_validation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    validation_type TEXT NOT NULL,
    is_valid BOOLEAN NOT NULL,
    issues JSONB,
    recommendations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for watchlist protection
CREATE INDEX IF NOT EXISTS idx_watchlist_backups_user_id ON watchlist_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_backups_created_at ON watchlist_backups(created_at);

CREATE INDEX IF NOT EXISTS idx_watchlist_validation_logs_user_id ON watchlist_validation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_validation_logs_is_valid ON watchlist_validation_logs(is_valid);
CREATE INDEX IF NOT EXISTS idx_watchlist_validation_logs_created_at ON watchlist_validation_logs(created_at);

-- RLS for watchlist protection
ALTER TABLE watchlist_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_validation_logs ENABLE ROW LEVEL SECURITY;

-- Users can manage their own watchlist data
CREATE POLICY "Users can manage own watchlist backups" ON watchlist_backups
    FOR ALL USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can view own validation logs" ON watchlist_validation_logs
    FOR SELECT USING (user_id = auth.uid()::uuid);

-- =============================================================================
-- 7. MANUAL PRO OVERRIDE
-- =============================================================================

-- Add manual pro override columns to user_subscriptions table
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS is_manual_pro BOOLEAN DEFAULT false;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS manual_pro_expires_at TIMESTAMP WITH TIME ZONE;

-- Index for manual pro overrides
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_manual_pro ON user_subscriptions(is_manual_pro);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_manual_pro_expires_at ON user_subscriptions(manual_pro_expires_at);

-- =============================================================================
-- 8. PERFORMANCE OPTIMIZATIONS
-- =============================================================================

-- Query logs table
CREATE TABLE IF NOT EXISTS query_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_text TEXT NOT NULL,
    execution_time INTEGER NOT NULL,
    rows_returned INTEGER,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API response cache table
CREATE TABLE IF NOT EXISTS api_response_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT NOT NULL UNIQUE,
    response_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    hit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_query_logs_execution_time ON query_logs(execution_time);
CREATE INDEX IF NOT EXISTS idx_query_logs_user_id ON query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_created_at ON query_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_api_response_cache_cache_key ON api_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_response_cache_expires_at ON api_response_cache(expires_at);

-- =============================================================================
-- 9. ML PREDICTIONS TABLE
-- =============================================================================

-- ML predictions table
CREATE TABLE IF NOT EXISTS ml_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('price', 'trend', 'volatility', 'sentiment')),
    prediction_value DECIMAL(10,4),
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    prediction_horizon TEXT NOT NULL CHECK (prediction_horizon IN ('1d', '1w', '1m', '3m', '6m', '1y')),
    model_version TEXT NOT NULL,
    input_features JSONB,
    prediction_metadata JSONB,
    accuracy_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes for ML predictions
CREATE INDEX IF NOT EXISTS idx_ml_predictions_symbol ON ml_predictions(symbol);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_prediction_type ON ml_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_confidence_score ON ml_predictions(confidence_score);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_created_at ON ml_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_expires_at ON ml_predictions(expires_at);

-- =============================================================================
-- 10. DAILY PERFORMANCE TRACKING
-- =============================================================================

-- Daily portfolio performance table
CREATE TABLE IF NOT EXISTS daily_portfolio_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    total_invested DECIMAL(15,2) NOT NULL,
    total_gain_loss DECIMAL(15,2) NOT NULL,
    total_return_percent DECIMAL(8,4) NOT NULL,
    day_change DECIMAL(15,2) NOT NULL,
    day_change_percent DECIMAL(8,4) NOT NULL,
    portfolio_holdings JSONB,
    performance_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for daily performance tracking
CREATE INDEX IF NOT EXISTS idx_daily_portfolio_performance_user_id ON daily_portfolio_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_portfolio_performance_date ON daily_portfolio_performance(date);
CREATE INDEX IF NOT EXISTS idx_daily_portfolio_performance_user_date ON daily_portfolio_performance(user_id, date);

-- RLS for daily performance tracking
ALTER TABLE daily_portfolio_performance ENABLE ROW LEVEL SECURITY;

-- Users can only access their own performance data
CREATE POLICY "Users can view own performance data" ON daily_portfolio_performance
    FOR SELECT USING (user_id = auth.uid()::uuid);

-- =============================================================================
-- 11. ENHANCED PAYMENT VERIFICATION
-- =============================================================================

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

-- Indexes for enhanced payment verification
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

-- RLS for enhanced payment verification
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
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

CREATE POLICY "Only admins can view security violations" ON security_violations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

CREATE POLICY "Only admins can view payment failures" ON payment_failures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

CREATE POLICY "Only admins can view system errors" ON system_errors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

CREATE POLICY "Only admins can view verification logs" ON payment_verification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Users can view their own verification logs
CREATE POLICY "Users can view their own verification logs" ON payment_verification_logs
    FOR SELECT USING (user_id = auth.uid()::uuid);

-- =============================================================================
-- 12. COMPREHENSIVE SECURITY
-- =============================================================================

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

-- Indexes for comprehensive security
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

-- RLS for comprehensive security
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
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Only admins can view rate limits
CREATE POLICY "Only admins can view rate limits" ON rate_limits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Users can view their own API keys
CREATE POLICY "Users can view own API keys" ON api_keys
    FOR SELECT USING (user_id = auth.uid()::uuid);

-- Users can manage their own API keys
CREATE POLICY "Users can manage own API keys" ON api_keys
    FOR ALL USING (user_id = auth.uid()::uuid);

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid()::uuid);

-- Users can manage their own sessions
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (user_id = auth.uid()::uuid);

-- Users can view their own device fingerprints
CREATE POLICY "Users can view own device fingerprints" ON device_fingerprints
    FOR SELECT USING (user_id = auth.uid()::uuid);

-- Only admins can view IP access control
CREATE POLICY "Only admins can view IP access control" ON ip_access_control
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Only admins can view security policies
CREATE POLICY "Only admins can view security policies" ON security_policies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- =============================================================================
-- 13. COMPREHENSIVE LOGGING
-- =============================================================================

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

-- Indexes for comprehensive logging
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

-- RLS for comprehensive logging
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
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Only admins can view audit trail
CREATE POLICY "Only admins can view audit trail" ON audit_trail
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Only admins can view performance logs
CREATE POLICY "Only admins can view performance logs" ON performance_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Only admins can view error logs
CREATE POLICY "Only admins can view error logs" ON error_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- Users can view their own API usage logs
CREATE POLICY "Users can view own API usage logs" ON api_usage_logs
    FOR SELECT USING (user_id = auth.uid()::uuid);

-- Only admins can view system health logs
CREATE POLICY "Only admins can view system health logs" ON system_health_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid()::text 
            AND (plan = 'admin' OR plan = 'master')
        )
    );

-- =============================================================================
-- 13. ANALYTICS AND REPORTING FUNCTIONS
-- =============================================================================

-- Function to get fraud analytics
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

-- Function to get security analytics
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

-- Function to get logging analytics
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

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old security events (90 days)
    DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old rate limits (7 days)
    DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- Delete expired sessions
    DELETE FROM user_sessions WHERE expires_at < NOW();
    
    -- Delete old device fingerprints (30 days)
    DELETE FROM device_fingerprints WHERE last_seen < NOW() - INTERVAL '30 days';
    
    -- Delete old application logs (30 days)
    DELETE FROM application_logs WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete old audit trail (90 days)
    DELETE FROM audit_trail WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Delete old performance logs (30 days)
    DELETE FROM performance_logs WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete old error logs (30 days, keep resolved errors longer)
    DELETE FROM error_logs WHERE timestamp < NOW() - INTERVAL '30 days' AND resolved = true;
    
    -- Delete old API usage logs (30 days)
    DELETE FROM api_usage_logs WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete old system health logs (30 days)
    DELETE FROM system_health_logs WHERE timestamp < NOW() - INTERVAL '30 days';
    
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

-- =============================================================================
-- 14. DEFAULT SECURITY POLICIES
-- =============================================================================

-- Create default security policies
INSERT INTO security_policies (name, description, rules) VALUES
('default_rate_limit', 'Default rate limiting policy', '{"window": 60, "max_requests": 60, "block_duration": 300}'),
('login_protection', 'Login attempt protection', '{"max_attempts": 5, "lockout_duration": 900, "require_2fa": false}'),
('session_security', 'Session security policy', '{"timeout": 86400, "require_reauth": false, "max_concurrent": 3}'),
('ip_protection', 'IP address protection', '{"enable_whitelist": false, "enable_blacklist": true, "auto_block_threshold": 0.8}')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 15. GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_fraud_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_verification_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_security_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_logging_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO authenticated;
GRANT EXECUTE ON FUNCTION is_ip_blocked(INET) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_risk_score(UUID) TO authenticated;

-- =============================================================================
-- 16. CREATE VIEWS FOR ADMIN DASHBOARD
-- =============================================================================

-- Create admin payment security dashboard view
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

-- Grant permissions on views
GRANT SELECT ON admin_payment_security_dashboard TO authenticated;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Log successful migration
INSERT INTO application_logs (level, message, context) VALUES 
('info', 'Complete system migration executed successfully', 
 '{"migration": "complete_system_migration", "version": "1.0.0", "tables_created": 25}');

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE 'Complete system migration executed successfully!';
    RAISE NOTICE 'All database tables, indexes, policies, and functions have been created.';
    RAISE NOTICE 'Your enhanced stock analysis website is ready to use.';
END $$;
