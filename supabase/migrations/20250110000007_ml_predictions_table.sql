-- Create ML predictions table for storing stabilized predictions
CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  current_price DECIMAL(12,4) NOT NULL,
  predicted_price DECIMAL(12,4) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  direction TEXT NOT NULL CHECK (direction IN ('bullish', 'bearish', 'neutral')),
  timeframe TEXT NOT NULL CHECK (timeframe IN ('1d', '1w', '1m', '3m', '6m', '1y')),
  technical_score DECIMAL(3,2) NOT NULL CHECK (technical_score >= 0 AND technical_score <= 1),
  fundamental_score DECIMAL(3,2) NOT NULL CHECK (fundamental_score >= 0 AND fundamental_score <= 1),
  sentiment_score DECIMAL(3,2) NOT NULL CHECK (sentiment_score >= 0 AND sentiment_score <= 1),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  reasoning JSONB DEFAULT '[]',
  factors JSONB DEFAULT '{}',
  accuracy DECIMAL(3,2),
  historical_accuracy DECIMAL(3,2),
  actual_direction TEXT CHECK (actual_direction IN ('bullish', 'bearish', 'neutral')),
  actual_price DECIMAL(12,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prediction accuracy tracking table
CREATE TABLE IF NOT EXISTS prediction_accuracy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID REFERENCES ml_predictions(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  predicted_direction TEXT NOT NULL,
  actual_direction TEXT NOT NULL,
  predicted_price DECIMAL(12,4) NOT NULL,
  actual_price DECIMAL(12,4) NOT NULL,
  accuracy_score DECIMAL(3,2) NOT NULL,
  timeframe TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prediction metrics table for aggregated statistics
CREATE TABLE IF NOT EXISTS prediction_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT,
  timeframe TEXT,
  total_predictions INTEGER DEFAULT 0,
  accurate_predictions INTEGER DEFAULT 0,
  average_accuracy DECIMAL(3,2) DEFAULT 0,
  confidence_distribution JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ml_predictions_symbol ON ml_predictions(symbol);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_created_at ON ml_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_direction ON ml_predictions(direction);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_timeframe ON ml_predictions(timeframe);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_confidence ON ml_predictions(confidence);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_risk_level ON ml_predictions(risk_level);

CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_symbol ON prediction_accuracy(symbol);
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_created_at ON prediction_accuracy(created_at);
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_prediction_id ON prediction_accuracy(prediction_id);

CREATE INDEX IF NOT EXISTS idx_prediction_metrics_symbol ON prediction_metrics(symbol);
CREATE INDEX IF NOT EXISTS idx_prediction_metrics_timeframe ON prediction_metrics(timeframe);
CREATE INDEX IF NOT EXISTS idx_prediction_metrics_created_at ON prediction_metrics(created_at);

-- Enable RLS
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view ML predictions" ON ml_predictions
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage ML predictions" ON ml_predictions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view prediction accuracy" ON prediction_accuracy
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage prediction accuracy" ON prediction_accuracy
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view prediction metrics" ON prediction_metrics
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage prediction metrics" ON prediction_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update prediction accuracy
CREATE OR REPLACE FUNCTION update_prediction_accuracy()
RETURNS TRIGGER AS $$
BEGIN
  -- Update accuracy when actual_direction is set
  IF NEW.actual_direction IS NOT NULL AND OLD.actual_direction IS NULL THEN
    INSERT INTO prediction_accuracy (
      prediction_id,
      symbol,
      predicted_direction,
      actual_direction,
      predicted_price,
      actual_price,
      accuracy_score,
      timeframe
    ) VALUES (
      NEW.id,
      NEW.symbol,
      NEW.direction,
      NEW.actual_direction,
      NEW.predicted_price,
      COALESCE(NEW.actual_price, NEW.current_price),
      CASE 
        WHEN NEW.direction = NEW.actual_direction THEN 1.0
        ELSE 0.0
      END,
      NEW.timeframe
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for accuracy tracking
CREATE TRIGGER update_prediction_accuracy_trigger
  AFTER UPDATE ON ml_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_prediction_accuracy();

-- Function to calculate prediction metrics
CREATE OR REPLACE FUNCTION calculate_prediction_metrics(
  target_symbol TEXT DEFAULT NULL,
  target_timeframe TEXT DEFAULT NULL
)
RETURNS TABLE(
  symbol TEXT,
  timeframe TEXT,
  total_predictions BIGINT,
  accurate_predictions BIGINT,
  average_accuracy DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.symbol,
    p.timeframe,
    COUNT(*) as total_predictions,
    COUNT(CASE WHEN p.direction = p.actual_direction THEN 1 END) as accurate_predictions,
    ROUND(
      COUNT(CASE WHEN p.direction = p.actual_direction THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL, 
      3
    ) as average_accuracy
  FROM ml_predictions p
  WHERE 
    (target_symbol IS NULL OR p.symbol = target_symbol) AND
    (target_timeframe IS NULL OR p.timeframe = target_timeframe) AND
    p.actual_direction IS NOT NULL
  GROUP BY p.symbol, p.timeframe
  ORDER BY average_accuracy DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get top performing predictions
CREATE OR REPLACE FUNCTION get_top_predictions(
  limit_count INTEGER DEFAULT 10,
  min_confidence DECIMAL DEFAULT 0.5
)
RETURNS TABLE(
  symbol TEXT,
  name TEXT,
  current_price DECIMAL,
  predicted_price DECIMAL,
  confidence DECIMAL,
  direction TEXT,
  timeframe TEXT,
  accuracy DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.symbol,
    p.name,
    p.current_price,
    p.predicted_price,
    p.confidence,
    p.direction,
    p.timeframe,
    COALESCE(p.accuracy, 0) as accuracy
  FROM ml_predictions p
  WHERE 
    p.confidence >= min_confidence AND
    p.created_at >= NOW() - INTERVAL '7 days'
  ORDER BY p.confidence DESC, p.accuracy DESC NULLS LAST
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE ml_predictions IS 'Stabilized ML predictions with comprehensive data';
COMMENT ON TABLE prediction_accuracy IS 'Tracking prediction accuracy over time';
COMMENT ON TABLE prediction_metrics IS 'Aggregated prediction performance metrics';
COMMENT ON FUNCTION calculate_prediction_metrics IS 'Calculate prediction accuracy metrics';
COMMENT ON FUNCTION get_top_predictions IS 'Get top performing predictions by confidence and accuracy';
