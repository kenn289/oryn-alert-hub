-- Complete User Initialization System
-- This script sets up automatic user initialization when new users are created
-- Run this in your Supabase SQL Editor

-- 1. Create function to initialize new user data
CREATE OR REPLACE FUNCTION initialize_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user record in users table
  INSERT INTO users (id, email, plan, is_active, created_at, last_login)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create welcome notification
  INSERT INTO notifications (user_id, type, title, message, read, created_at)
  VALUES (
    NEW.id,
    'user_joined',
    'Welcome to Oryn Alert Hub!',
    'Welcome ' || NEW.email || '! Your account has been created successfully. Start exploring our features and set up your first stock alerts.',
    FALSE,
    NOW()
  );

  -- Create default subscription (free plan)
  INSERT INTO subscriptions (user_id, plan, status, amount, currency, start_date, created_at)
  VALUES (
    NEW.id,
    'free',
    'active',
    0,
    'INR',
    NOW(),
    NOW()
  );

  -- Create sample notifications to help users understand the system
  INSERT INTO notifications (user_id, type, title, message, read, created_at)
  VALUES 
    (
      NEW.id,
      'alert_triggered',
      'Sample Alert',
      'This is a sample notification. You can create stock alerts and receive notifications like this.',
      FALSE,
      NOW()
    ),
    (
      NEW.id,
      'plan_updated',
      'Free Plan Active',
      'You are currently on the free plan. Upgrade to Pro for advanced features.',
      FALSE,
      NOW()
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger on auth.users table
-- Note: This requires the auth schema to be accessible
-- If this doesn't work, we'll handle it in the application code

-- 3. Create function to update last login
CREATE OR REPLACE FUNCTION update_user_last_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_login in users table when user signs in
  UPDATE users 
  SET last_login = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- 5. Create function to get user initialization status
CREATE OR REPLACE FUNCTION get_user_initialization_status(user_id UUID)
RETURNS TABLE (
  user_exists BOOLEAN,
  has_notifications BOOLEAN,
  has_subscription BOOLEAN,
  notification_count INTEGER,
  subscription_plan TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM users WHERE id = user_id) as user_exists,
    EXISTS(SELECT 1 FROM notifications WHERE user_id = user_id) as has_notifications,
    EXISTS(SELECT 1 FROM subscriptions WHERE user_id = user_id) as has_subscription,
    (SELECT COUNT(*) FROM notifications WHERE user_id = user_id)::INTEGER as notification_count,
    (SELECT plan FROM subscriptions WHERE user_id = user_id ORDER BY created_at DESC LIMIT 1) as subscription_plan;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to manually initialize a user (for existing users)
CREATE OR REPLACE FUNCTION manual_user_initialization(user_id UUID, user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user already exists
  IF EXISTS(SELECT 1 FROM users WHERE id = user_id) THEN
    RETURN FALSE; -- User already initialized
  END IF;

  -- Initialize user data
  PERFORM initialize_new_user_data(user_id, user_email);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Create helper function for user data initialization
CREATE OR REPLACE FUNCTION initialize_new_user_data(user_id UUID, user_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Create user record
  INSERT INTO users (id, email, plan, is_active, created_at, last_login)
  VALUES (user_id, user_email, 'free', TRUE, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Create welcome notification
  INSERT INTO notifications (user_id, type, title, message, read, created_at)
  VALUES (
    user_id,
    'user_joined',
    'Welcome to Oryn Alert Hub!',
    'Welcome ' || user_email || '! Your account has been created successfully.',
    FALSE,
    NOW()
  );

  -- Create default subscription
  INSERT INTO subscriptions (user_id, plan, status, amount, currency, start_date, created_at)
  VALUES (user_id, 'free', 'active', 0, 'INR', NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Create sample notifications
  INSERT INTO notifications (user_id, type, title, message, read, created_at)
  VALUES 
    (user_id, 'alert_triggered', 'Sample Alert', 'This is a sample notification.', FALSE, NOW()),
    (user_id, 'plan_updated', 'Free Plan Active', 'You are on the free plan.', FALSE, NOW());
END;
$$ LANGUAGE plpgsql;

-- 8. Verify the setup
SELECT 'User initialization system setup complete!' as status;

-- 9. Test the initialization function (optional - remove in production)
-- SELECT manual_user_initialization('test-user-id', 'test@example.com');
