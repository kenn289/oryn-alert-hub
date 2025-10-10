-- Create daily performance snapshots table
CREATE TABLE IF NOT EXISTS daily_performance_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  total_value DECIMAL(18,6) NOT NULL,
  total_invested DECIMAL(18,6) NOT NULL,
  total_gain_loss DECIMAL(18,6) NOT NULL,
  total_gain_loss_percent DECIMAL(8,4) NOT NULL,
  day_change DECIMAL(18,6) NOT NULL,
  day_change_percent DECIMAL(8,4) NOT NULL,
  portfolio_items INTEGER DEFAULT 0,
  top_performer JSONB,
  worst_performer JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create performance metrics table for aggregated analytics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  total_return DECIMAL(8,4) DEFAULT 0,
  annualized_return DECIMAL(8,4) DEFAULT 0,
  volatility DECIMAL(8,4) DEFAULT 0,
  sharpe_ratio DECIMAL(8,4) DEFAULT 0,
  max_drawdown DECIMAL(8,4) DEFAULT 0,
  win_rate DECIMAL(8,4) DEFAULT 0,
  average_win DECIMAL(8,4) DEFAULT 0,
  average_loss DECIMAL(8,4) DEFAULT 0,
  profit_factor DECIMAL(8,4) DEFAULT 0,
  sortino_ratio DECIMAL(8,4) DEFAULT 0,
  calmar_ratio DECIMAL(8,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create portfolio analytics cache table
CREATE TABLE IF NOT EXISTS portfolio_analytics_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  analytics_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cache_key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_snapshots_user_id ON daily_performance_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_snapshots_date ON daily_performance_snapshots(date);
CREATE INDEX IF NOT EXISTS idx_daily_snapshots_user_date ON daily_performance_snapshots(user_id, date);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_date ON performance_metrics(user_id, date);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_user_id ON portfolio_analytics_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires_at ON portfolio_analytics_cache(expires_at);

-- Enable RLS
ALTER TABLE daily_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_analytics_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own daily snapshots" ON daily_performance_snapshots
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage daily snapshots" ON daily_performance_snapshots
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own performance metrics" ON performance_metrics
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage performance metrics" ON performance_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own analytics cache" ON portfolio_analytics_cache
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage analytics cache" ON portfolio_analytics_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Function to calculate daily performance metrics
CREATE OR REPLACE FUNCTION calculate_daily_performance_metrics(
  target_user_id TEXT,
  target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_return DECIMAL,
  annualized_return DECIMAL,
  volatility DECIMAL,
  sharpe_ratio DECIMAL,
  max_drawdown DECIMAL,
  win_rate DECIMAL,
  average_win DECIMAL,
  average_loss DECIMAL,
  profit_factor DECIMAL,
  sortino_ratio DECIMAL,
  calmar_ratio DECIMAL
) AS $$
DECLARE
  snapshots RECORD[];
  values DECIMAL[];
  returns DECIMAL[];
  i INTEGER;
  total_return DECIMAL;
  annualized_return DECIMAL;
  mean_return DECIMAL;
  volatility DECIMAL;
  sharpe_ratio DECIMAL;
  max_drawdown DECIMAL;
  peak DECIMAL;
  drawdown DECIMAL;
  win_rate DECIMAL;
  positive_returns INTEGER;
  average_win DECIMAL;
  average_loss DECIMAL;
  profit_factor DECIMAL;
  sortino_ratio DECIMAL;
  calmar_ratio DECIMAL;
  wins DECIMAL[];
  losses DECIMAL[];
  total_wins DECIMAL;
  total_losses DECIMAL;
  downside_returns DECIMAL[];
  downside_deviation DECIMAL;
BEGIN
  -- Get snapshots for the user
  SELECT ARRAY_AGG(
    ROW(total_value, day_change, total_gain_loss_percent)::RECORD
  ) INTO snapshots
  FROM daily_performance_snapshots
  WHERE user_id = target_user_id
  ORDER BY date DESC
  LIMIT 30;

  -- If no snapshots, return zeros
  IF snapshots IS NULL OR array_length(snapshots, 1) < 2 THEN
    RETURN QUERY SELECT 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0;
    RETURN;
  END IF;

  -- Extract values
  values := ARRAY(SELECT (snapshots[i]).total_value FROM generate_subscripts(snapshots, 1) AS i ORDER BY i DESC);
  
  -- Calculate returns
  returns := ARRAY[]::DECIMAL[];
  FOR i IN 2..array_length(values, 1) LOOP
    returns := returns || ((values[i] - values[i-1]) / values[i-1]);
  END LOOP;

  -- Calculate metrics
  total_return := (values[1] - values[array_length(values, 1)]) / values[array_length(values, 1)];
  annualized_return := POWER(1 + total_return, 365.0 / array_length(values, 1)) - 1;
  
  mean_return := (SELECT AVG(r) FROM unnest(returns) AS r);
  volatility := SQRT((SELECT AVG(POWER(r - mean_return, 2)) FROM unnest(returns) AS r));
  
  sharpe_ratio := CASE WHEN volatility > 0 THEN (mean_return - 0.02) / volatility ELSE 0 END;
  
  -- Calculate max drawdown
  max_drawdown := 0;
  peak := values[array_length(values, 1)];
  FOR i IN array_length(values, 1)..1 LOOP
    IF values[i] > peak THEN
      peak := values[i];
    END IF;
    drawdown := (peak - values[i]) / peak;
    IF drawdown > max_drawdown THEN
      max_drawdown := drawdown;
    END IF;
  END LOOP;

  -- Calculate win rate
  positive_returns := (SELECT COUNT(*) FROM unnest(returns) AS r WHERE r > 0);
  win_rate := CASE WHEN array_length(returns, 1) > 0 THEN positive_returns::DECIMAL / array_length(returns, 1) ELSE 0 END;

  -- Calculate average win and loss
  wins := ARRAY(SELECT r FROM unnest(returns) AS r WHERE r > 0);
  losses := ARRAY(SELECT r FROM unnest(returns) AS r WHERE r < 0);
  
  average_win := CASE WHEN array_length(wins, 1) > 0 THEN (SELECT AVG(w) FROM unnest(wins) AS w) ELSE 0 END;
  average_loss := CASE WHEN array_length(losses, 1) > 0 THEN (SELECT AVG(l) FROM unnest(losses) AS l) ELSE 0 END;

  -- Calculate profit factor
  total_wins := (SELECT COALESCE(SUM(w), 0) FROM unnest(wins) AS w);
  total_losses := ABS((SELECT COALESCE(SUM(l), 0) FROM unnest(losses) AS l));
  profit_factor := CASE WHEN total_losses > 0 THEN total_wins / total_losses ELSE 0 END;

  -- Calculate Sortino ratio
  downside_returns := ARRAY(SELECT r FROM unnest(returns) AS r WHERE r < 0);
  downside_deviation := CASE 
    WHEN array_length(downside_returns, 1) > 0 
    THEN SQRT((SELECT AVG(POWER(r, 2)) FROM unnest(downside_returns) AS r))
    ELSE 0 
  END;
  sortino_ratio := CASE WHEN downside_deviation > 0 THEN (mean_return - 0.02) / downside_deviation ELSE 0 END;

  -- Calculate Calmar ratio
  calmar_ratio := CASE WHEN max_drawdown > 0 THEN annualized_return / max_drawdown ELSE 0 END;

  RETURN QUERY SELECT 
    total_return, annualized_return, volatility, sharpe_ratio, max_drawdown,
    win_rate, average_win, average_loss, profit_factor, sortino_ratio, calmar_ratio;
END;
$$ LANGUAGE plpgsql;

-- Function to get performance chart data
CREATE OR REPLACE FUNCTION get_performance_chart_data(
  target_user_id TEXT,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  date DATE,
  value DECIMAL,
  gain_loss DECIMAL,
  gain_loss_percent DECIMAL,
  day_change DECIMAL,
  day_change_percent DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.date,
    s.total_value,
    s.total_gain_loss,
    s.total_gain_loss_percent,
    s.day_change,
    s.day_change_percent
  FROM daily_performance_snapshots s
  WHERE s.user_id = target_user_id
  ORDER BY s.date DESC
  LIMIT days_back;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old analytics cache
CREATE OR REPLACE FUNCTION cleanup_analytics_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM portfolio_analytics_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get top performers
CREATE OR REPLACE FUNCTION get_top_performers(
  target_user_id TEXT,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE(
  symbol TEXT,
  name TEXT,
  gain_loss DECIMAL,
  gain_loss_percent DECIMAL,
  current_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.ticker,
    p.name,
    (p.shares * p.current_price) - (p.shares * p.avg_price) as gain_loss,
    CASE 
      WHEN (p.shares * p.avg_price) > 0 
      THEN (((p.shares * p.current_price) - (p.shares * p.avg_price)) / (p.shares * p.avg_price)) * 100
      ELSE 0 
    END as gain_loss_percent,
    p.shares * p.current_price as current_value
  FROM portfolios p
  WHERE p.user_id = target_user_id
  ORDER BY gain_loss DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE daily_performance_snapshots IS 'Daily snapshots of portfolio performance';
COMMENT ON TABLE performance_metrics IS 'Calculated performance metrics for portfolios';
COMMENT ON TABLE portfolio_analytics_cache IS 'Cached portfolio analytics data';
COMMENT ON FUNCTION calculate_daily_performance_metrics IS 'Calculate comprehensive performance metrics';
COMMENT ON FUNCTION get_performance_chart_data IS 'Get performance data for charting';
COMMENT ON FUNCTION cleanup_analytics_cache IS 'Clean up expired analytics cache';
COMMENT ON FUNCTION get_top_performers IS 'Get top performing portfolio items';
