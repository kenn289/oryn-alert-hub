-- Performance optimization indexes
-- These indexes will significantly improve query performance

-- Users table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_manual_pro_override ON users(manual_pro_override);

-- Watchlist optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_watchlists_user_ticker ON watchlists(user_id, ticker);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_watchlists_market ON watchlists(market);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_watchlists_added_at ON watchlists(added_at);

-- Portfolio optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portfolios_ticker ON portfolios(ticker);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portfolios_created_at ON portfolios(created_at);

-- Subscription optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_plan ON user_subscriptions(plan);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_auto_renew ON user_subscriptions(auto_renew);

-- Payment optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_orders_user_status ON payment_orders(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_orders_paid_at ON payment_orders(paid_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_orders_amount ON payment_orders(amount);

-- Payment states optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_states_user_status ON payment_states(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_states_order_id ON payment_states(order_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_states_created_at ON payment_states(created_at);

-- Revenue optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_logs_confirmed_at ON revenue_logs(confirmed_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_logs_status ON revenue_logs(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_logs_amount ON revenue_logs(amount);

-- Webhook logging optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);

-- Manual Pro grants optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manual_pro_grants_user_id ON manual_pro_grants(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manual_pro_grants_granted_by ON manual_pro_grants(granted_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manual_pro_grants_created_at ON manual_pro_grants(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manual_pro_grants_revoked_at ON manual_pro_grants(revoked_at);

-- Watchlist protection optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_watchlist_backups_user_id ON watchlist_backups(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_watchlist_backups_created_at ON watchlist_backups(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_watchlist_backups_type ON watchlist_backups(backup_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_watchlist_validation_user_id ON watchlist_validation_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_watchlist_validation_created_at ON watchlist_validation_logs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_watchlist_validation_valid ON watchlist_validation_logs(is_valid);

-- Day change events optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_day_change_events_market ON day_change_events(market);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_day_change_events_processed_at ON day_change_events(processed_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_day_change_events_success ON day_change_events(success);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_plan_created ON users(plan, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_plan_status ON user_subscriptions(user_id, plan, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user_status_amount ON payment_orders(user_id, status, amount);

-- Partial indexes for better performance on filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_subscriptions ON user_subscriptions(user_id) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_paid_orders ON payment_orders(user_id, paid_at) 
WHERE status = 'paid';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manual_pro_users ON users(id, plan) 
WHERE manual_pro_override = true;

-- Function to analyze table statistics
CREATE OR REPLACE FUNCTION analyze_table_stats()
RETURNS TABLE(
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT,
  total_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE(
  query TEXT,
  calls BIGINT,
  total_time DOUBLE PRECISION,
  mean_time DOUBLE PRECISION,
  rows BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to vacuum and analyze tables
CREATE OR REPLACE FUNCTION optimize_tables()
RETURNS TEXT AS $$
DECLARE
  table_name TEXT;
  result TEXT := '';
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE 'VACUUM ANALYZE ' || table_name;
    result := result || 'Optimized ' || table_name || E'\n';
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a view for performance monitoring
CREATE OR REPLACE VIEW performance_monitoring AS
SELECT 
  'Users' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('users')) as size
FROM users
UNION ALL
SELECT 
  'Watchlists' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('watchlists')) as size
FROM watchlists
UNION ALL
SELECT 
  'Portfolios' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('portfolios')) as size
FROM portfolios
UNION ALL
SELECT 
  'User Subscriptions' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('user_subscriptions')) as size
FROM user_subscriptions
UNION ALL
SELECT 
  'Payment Orders' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('payment_orders')) as size
FROM payment_orders;

-- Add comments
COMMENT ON FUNCTION analyze_table_stats IS 'Analyze table statistics for performance monitoring';
COMMENT ON FUNCTION get_slow_queries IS 'Get slow queries for performance optimization';
COMMENT ON FUNCTION optimize_tables IS 'Vacuum and analyze all tables for optimization';
COMMENT ON VIEW performance_monitoring IS 'Performance monitoring view for database statistics';
