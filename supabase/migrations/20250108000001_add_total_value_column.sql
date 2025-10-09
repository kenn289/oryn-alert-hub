-- Add total_value column to portfolios table
-- This column stores the calculated total value (shares * current_price)
-- to avoid recalculating it every time and improve performance

-- Add total_value column
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS total_value DECIMAL(18,6) DEFAULT 0;

-- Add gain_loss column for calculated gain/loss
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS gain_loss DECIMAL(18,6) DEFAULT 0;

-- Add gain_loss_percent column for calculated gain/loss percentage
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS gain_loss_percent DECIMAL(18,6) DEFAULT 0;

-- Create index on total_value for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_total_value ON portfolios(total_value);

-- Create index on gain_loss for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_gain_loss ON portfolios(gain_loss);

-- Add comments explaining the columns
COMMENT ON COLUMN portfolios.total_value IS 'Calculated total value (shares * current_price)';
COMMENT ON COLUMN portfolios.gain_loss IS 'Calculated gain/loss (total_value - (shares * avg_price))';
COMMENT ON COLUMN portfolios.gain_loss_percent IS 'Calculated gain/loss percentage';

-- Create a function to automatically update total_value, gain_loss, and gain_loss_percent
CREATE OR REPLACE FUNCTION update_portfolio_calculations()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total_value
    NEW.total_value = NEW.shares * NEW.current_price;
    
    -- Calculate gain_loss
    NEW.gain_loss = NEW.total_value - (NEW.shares * NEW.avg_price);
    
    -- Calculate gain_loss_percent
    IF (NEW.shares * NEW.avg_price) > 0 THEN
        NEW.gain_loss_percent = (NEW.gain_loss / (NEW.shares * NEW.avg_price)) * 100;
    ELSE
        NEW.gain_loss_percent = 0;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update calculations when portfolio data changes
CREATE TRIGGER update_portfolio_calculations_trigger
    BEFORE INSERT OR UPDATE ON portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_calculations();

-- Update existing records to populate the new columns
UPDATE portfolios 
SET 
    total_value = shares * current_price,
    gain_loss = (shares * current_price) - (shares * avg_price),
    gain_loss_percent = CASE 
        WHEN (shares * avg_price) > 0 THEN 
            (((shares * current_price) - (shares * avg_price)) / (shares * avg_price)) * 100
        ELSE 0 
    END;
