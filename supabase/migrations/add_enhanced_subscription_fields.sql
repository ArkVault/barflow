-- Migration: Add additional subscription tracking fields to establishments table
-- Description: Adds fields for enhanced subscription management (trial warning, payment tracking)

-- Add new columns for enhanced subscription tracking
ALTER TABLE establishments
ADD COLUMN IF NOT EXISTS trial_ending_soon BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_failed_count INTEGER DEFAULT 0;

-- Create index for payment tracking
CREATE INDEX IF NOT EXISTS idx_establishments_trial_ending_soon ON establishments(trial_ending_soon) WHERE trial_ending_soon = TRUE;

-- Add comments
COMMENT ON COLUMN establishments.trial_ending_soon IS 'Flag set when trial is ending in 3 days (via Stripe webhook)';
COMMENT ON COLUMN establishments.last_payment_date IS 'Date of last successful payment';
COMMENT ON COLUMN establishments.payment_failed_count IS 'Number of consecutive failed payment attempts';

-- Update subscription status comment to include new states
COMMENT ON COLUMN establishments.subscription_status IS 'Status: trialing, active, past_due, canceled, unpaid, paused, requires_action, incomplete, incomplete_expired, expired';

-- Function to reset payment failed count on successful payment
CREATE OR REPLACE FUNCTION reset_payment_failed_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_status = 'active' AND OLD.subscription_status != 'active' THEN
    NEW.payment_failed_count := 0;
    NEW.trial_ending_soon := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-reset failed count
DROP TRIGGER IF EXISTS trigger_reset_payment_failed ON establishments;
CREATE TRIGGER trigger_reset_payment_failed
  BEFORE UPDATE ON establishments
  FOR EACH ROW
  WHEN (NEW.subscription_status = 'active')
  EXECUTE FUNCTION reset_payment_failed_count();
