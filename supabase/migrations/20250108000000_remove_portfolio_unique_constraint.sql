-- Remove unique constraint to allow multiple entries of same stock
-- This allows users to track different purchase lots of the same stock

-- Drop the unique constraint on user_id, ticker
ALTER TABLE portfolios DROP CONSTRAINT IF EXISTS portfolios_user_id_ticker_key;

-- Add lot_id column to track different purchase lots
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS lot_id TEXT;

-- Create index on lot_id for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_lot_id ON portfolios(lot_id);

-- Add a comment explaining the change
COMMENT ON TABLE portfolios IS 'User portfolio holdings - allows multiple entries of same stock for different purchase lots';
