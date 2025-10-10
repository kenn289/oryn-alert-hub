-- Add manual override fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS manual_pro_override BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manual_pro_granted_by TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manual_pro_granted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manual_pro_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manual_pro_expires_at TIMESTAMP WITH TIME ZONE;

-- Add manual override fields to user_subscriptions table
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN DEFAULT FALSE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS manual_override_granted_by TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS manual_override_reason TEXT;

-- Create manual pro grants table for audit trail
CREATE TABLE IF NOT EXISTS manual_pro_grants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  granted_by TEXT NOT NULL,
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by TEXT,
  revoked_reason TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_manual_pro_grants_user_id ON manual_pro_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_pro_grants_granted_by ON manual_pro_grants(granted_by);
CREATE INDEX IF NOT EXISTS idx_manual_pro_grants_created_at ON manual_pro_grants(created_at);

-- Enable RLS
ALTER TABLE manual_pro_grants ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own manual pro grants" ON manual_pro_grants
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all manual pro grants" ON manual_pro_grants
  FOR ALL USING (auth.role() = 'service_role');

-- Function to grant manual Pro access
CREATE OR REPLACE FUNCTION grant_manual_pro_access(
  target_user_id TEXT,
  granted_by_user_id TEXT,
  reason TEXT DEFAULT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Insert into manual pro grants table
  INSERT INTO manual_pro_grants (user_id, granted_by, reason, expires_at)
  VALUES (target_user_id, granted_by_user_id, reason, expires_at);

  -- Update user table
  UPDATE users 
  SET 
    plan = 'pro',
    manual_pro_override = TRUE,
    manual_pro_granted_by = granted_by_user_id,
    manual_pro_granted_at = NOW(),
    manual_pro_reason = reason,
    manual_pro_expires_at = expires_at,
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Create or update subscription
  INSERT INTO user_subscriptions (
    user_id, 
    plan, 
    status, 
    start_date, 
    end_date, 
    is_manual_override,
    manual_override_granted_by,
    manual_override_reason,
    currency
  )
  VALUES (
    target_user_id,
    'pro',
    'active',
    NOW(),
    COALESCE(expires_at, NOW() + INTERVAL '1 year'),
    TRUE,
    granted_by_user_id,
    reason,
    'INR'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan = 'pro',
    status = 'active',
    is_manual_override = TRUE,
    manual_override_granted_by = granted_by_user_id,
    manual_override_reason = reason,
    updated_at = NOW();

  result := jsonb_build_object(
    'success', TRUE,
    'message', 'Manual Pro access granted successfully',
    'user_id', target_user_id,
    'granted_by', granted_by_user_id,
    'expires_at', expires_at
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to revoke manual Pro access
CREATE OR REPLACE FUNCTION revoke_manual_pro_access(
  target_user_id TEXT,
  revoked_by_user_id TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update manual pro grants table
  UPDATE manual_pro_grants 
  SET 
    revoked_at = NOW(),
    revoked_by = revoked_by_user_id,
    revoked_reason = reason
  WHERE user_id = target_user_id AND revoked_at IS NULL;

  -- Update user table
  UPDATE users 
  SET 
    plan = 'free',
    manual_pro_override = FALSE,
    manual_pro_granted_by = NULL,
    manual_pro_granted_at = NULL,
    manual_pro_reason = NULL,
    manual_pro_expires_at = NULL,
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Update subscription
  UPDATE user_subscriptions 
  SET 
    status = 'cancelled',
    is_manual_override = FALSE,
    manual_override_granted_by = NULL,
    manual_override_reason = NULL,
    updated_at = NOW()
  WHERE user_id = target_user_id;

  result := jsonb_build_object(
    'success', TRUE,
    'message', 'Manual Pro access revoked successfully',
    'user_id', target_user_id,
    'revoked_by', revoked_by_user_id
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check if manual Pro access is still valid
CREATE OR REPLACE FUNCTION is_manual_pro_valid(user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT 
    manual_pro_override,
    manual_pro_expires_at
  INTO user_record
  FROM users 
  WHERE id = user_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF NOT user_record.manual_pro_override THEN
    RETURN FALSE;
  END IF;

  -- Check if manual Pro access has expired
  IF user_record.manual_pro_expires_at IS NOT NULL AND user_record.manual_pro_expires_at < NOW() THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE manual_pro_grants IS 'Audit trail for manual Pro access grants';
COMMENT ON FUNCTION grant_manual_pro_access IS 'Grants manual Pro access to a user';
COMMENT ON FUNCTION revoke_manual_pro_access IS 'Revokes manual Pro access from a user';
COMMENT ON FUNCTION is_manual_pro_valid IS 'Checks if manual Pro access is still valid';
