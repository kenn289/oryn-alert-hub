-- Add Sample Users to Database
-- Run this in Supabase SQL Editor after the main database fix

-- Insert sample users for testing
INSERT INTO users (email, plan, is_active, created_at) VALUES 
('kennethoswin289@gmail.com', 'master', TRUE, NOW()),
('user1@example.com', 'free', TRUE, NOW() - INTERVAL '30 days'),
('user2@example.com', 'pro', TRUE, NOW() - INTERVAL '15 days'),
('user3@example.com', 'free', TRUE, NOW() - INTERVAL '7 days'),
('user4@example.com', 'pro', TRUE, NOW() - INTERVAL '3 days'),
('user5@example.com', 'free', TRUE, NOW() - INTERVAL '1 day')
ON CONFLICT (email) DO UPDATE SET 
  plan = EXCLUDED.plan,
  is_active = EXCLUDED.is_active;

-- Insert sample support tickets
INSERT INTO support_tickets (subject, description, priority, status, user_id, user_email, created_at) VALUES 
('Login Issue', 'Cannot login to my account', 'high', 'open', (SELECT id FROM users WHERE email = 'user1@example.com'), 'user1@example.com', NOW() - INTERVAL '2 days'),
('Feature Request', 'Need dark mode option', 'medium', 'open', (SELECT id FROM users WHERE email = 'user2@example.com'), 'user2@example.com', NOW() - INTERVAL '1 day'),
('Bug Report', 'App crashes on mobile', 'urgent', 'in_progress', (SELECT id FROM users WHERE email = 'user3@example.com'), 'user3@example.com', NOW() - INTERVAL '6 hours'),
('Billing Question', 'How to upgrade to Pro plan?', 'low', 'resolved', (SELECT id FROM users WHERE email = 'user4@example.com'), 'user4@example.com', NOW() - INTERVAL '1 day'),
('Performance Issue', 'Slow loading times', 'high', 'open', (SELECT id FROM users WHERE email = 'user5@example.com'), 'user5@example.com', NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, created_at) VALUES 
((SELECT id FROM users WHERE email = 'user1@example.com'), 'ticket_created', 'Support Ticket Created', 'Your support ticket has been created and is being reviewed', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE email = 'user2@example.com'), 'plan_updated', 'Plan Upgraded', 'Your plan has been upgraded to Pro!', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE email = 'user3@example.com'), 'alert_triggered', 'Stock Alert', 'Your stock alert has been triggered', NOW() - INTERVAL '6 hours'),
((SELECT id FROM users WHERE email = 'user4@example.com'), 'ticket_resolved', 'Ticket Resolved', 'Your billing question has been resolved', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE email = 'user5@example.com'), 'ticket_created', 'Support Ticket Created', 'Your support ticket has been created and is being reviewed', NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Support Tickets', COUNT(*) FROM support_tickets
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;
