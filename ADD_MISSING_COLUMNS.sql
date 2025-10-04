-- Add missing columns to support_tickets table for rating system
-- Run this in your Supabase SQL Editor

-- Add rating column (1-5 scale)
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Add feedback column for user comments
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Add updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for support_tickets if not exists
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'support_tickets' 
AND column_name IN ('rating', 'feedback')
ORDER BY column_name;
