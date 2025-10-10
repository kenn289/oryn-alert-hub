-- Create refresh_tokens table for secure session management
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_id TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_id ON refresh_tokens(token_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

-- Enable RLS
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own refresh tokens" ON refresh_tokens
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all refresh tokens" ON refresh_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM refresh_tokens 
  WHERE expires_at < NOW() 
  OR (is_revoked = true AND revoked_at < NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically clean up expired tokens
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up expired tokens when new ones are inserted
  PERFORM cleanup_expired_refresh_tokens();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_expired_tokens_trigger
  AFTER INSERT ON refresh_tokens
  FOR EACH ROW EXECUTE FUNCTION trigger_cleanup_expired_tokens();

-- Add comments
COMMENT ON TABLE refresh_tokens IS 'Secure refresh token storage for JWT session management';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA256 hash of the refresh token for security';
COMMENT ON COLUMN refresh_tokens.is_revoked IS 'Whether the token has been revoked (logout)';
COMMENT ON COLUMN refresh_tokens.last_used_at IS 'Last time the token was used to refresh access token';
