-- Create watchlist backups table
CREATE TABLE IF NOT EXISTS watchlist_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  backup_data JSONB NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('automatic', 'manual', 'before_delete', 'before_update')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create watchlist validation logs table
CREATE TABLE IF NOT EXISTS watchlist_validation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  is_valid BOOLEAN NOT NULL,
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  suggestion_count INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  suggestions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_watchlist_backups_user_id ON watchlist_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_backups_created_at ON watchlist_backups(created_at);
CREATE INDEX IF NOT EXISTS idx_watchlist_backups_type ON watchlist_backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_watchlist_validation_user_id ON watchlist_validation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_validation_created_at ON watchlist_validation_logs(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE watchlist_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_validation_logs ENABLE ROW LEVEL SECURITY;

-- Policy for watchlist_backups - users can only see their own backups
CREATE POLICY "Users can manage their own watchlist backups" ON watchlist_backups
  FOR ALL USING (auth.uid()::text = user_id);

-- Policy for watchlist_validation_logs - users can only see their own validation logs
CREATE POLICY "Users can manage their own validation logs" ON watchlist_validation_logs
  FOR ALL USING (auth.uid()::text = user_id);

-- Function to automatically create backup before watchlist changes
CREATE OR REPLACE FUNCTION create_watchlist_backup_before_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Create backup before any change
  INSERT INTO watchlist_backups (user_id, backup_data, backup_type, metadata)
  SELECT 
    COALESCE(NEW.user_id, OLD.user_id),
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'ticker', ticker,
        'name', name,
        'price', price,
        'change', change,
        'change_percent', change_percent,
        'market', market,
        'currency', currency,
        'addedAt', added_at
      )
    ),
    'before_update',
    jsonb_build_object(
      'reason', 'Automatic backup before change',
      'trigger', TG_OP,
      'item_count', count(*)
    )
  FROM watchlists 
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic backups
DROP TRIGGER IF EXISTS watchlist_backup_trigger ON watchlists;
CREATE TRIGGER watchlist_backup_trigger
  BEFORE UPDATE OR DELETE ON watchlists
  FOR EACH ROW
  EXECUTE FUNCTION create_watchlist_backup_before_change();

-- Function to clean up old backups (keep last 10 per user)
CREATE OR REPLACE FUNCTION cleanup_old_watchlist_backups()
RETURNS void AS $$
BEGIN
  DELETE FROM watchlist_backups
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM watchlist_backups
    ) ranked
    WHERE rn > 10
  );
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old backups (this would need to be set up in your cron system)
-- You can call this function periodically to clean up old backups
