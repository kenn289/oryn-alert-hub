-- Delete all users except the master account
-- Run this in your Supabase SQL Editor

-- First, let's see what users exist
SELECT id, email, plan, created_at 
FROM users 
ORDER BY created_at DESC;

-- Delete all users except the master account
DELETE FROM users 
WHERE email != 'kennethoswin289@gmail.com';

-- Also clean up related data for deleted users
-- Delete notifications for non-master users
DELETE FROM notifications 
WHERE user_id NOT IN (
  SELECT id FROM users WHERE email = 'kennethoswin289@gmail.com'
);

-- Delete support tickets for non-master users
DELETE FROM support_tickets 
WHERE user_id NOT IN (
  SELECT id FROM users WHERE email = 'kennethoswin289@gmail.com'
);

-- Delete subscriptions for non-master users
DELETE FROM subscriptions 
WHERE user_id NOT IN (
  SELECT id FROM users WHERE email = 'kennethoswin289@gmail.com'
);

-- Verify only master account remains
SELECT id, email, plan, created_at 
FROM users 
ORDER BY created_at DESC;

-- Show counts of remaining data
SELECT 
  (SELECT COUNT(*) FROM users) as user_count,
  (SELECT COUNT(*) FROM notifications) as notification_count,
  (SELECT COUNT(*) FROM support_tickets) as ticket_count,
  (SELECT COUNT(*) FROM subscriptions) as subscription_count;
