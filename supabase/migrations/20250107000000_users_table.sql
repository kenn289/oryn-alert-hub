-- Create users table for master dashboard
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'master')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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

-- RLS policy: only master users can see all users
CREATE POLICY "Master users can see all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id::text = auth.uid()::text 
      AND auth.users.email = 'kennethoswin289@gmail.com'
    )
  );

-- Function to sync auth users to users table
CREATE OR REPLACE FUNCTION sync_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user in users table
  INSERT INTO users (id, email, created_at, last_login, is_active)
  VALUES (
    NEW.id::text,
    NEW.email,
    NEW.created_at,
    NEW.updated_at,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    last_login = EXCLUDED.updated_at,
    is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync auth users
CREATE TRIGGER sync_auth_user_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_auth_user();

-- Insert existing auth users
INSERT INTO users (id, email, created_at, last_login, is_active, plan)
SELECT 
  id::text,
  email,
  created_at,
  updated_at,
  true,
  CASE 
    WHEN email = 'kennethoswin289@gmail.com' THEN 'master'
    ELSE 'free'
  END
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  last_login = EXCLUDED.last_login,
  is_active = true;
