-- Migration: Add subscription and trial fields to establishments table
-- Description: Adds fields for managing subscriptions, trials, and Stripe integration

-- Add subscription-related columns to establishments table
ALTER TABLE establishments
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing',
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free_trial',
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_establishments_user_id ON establishments(user_id);
CREATE INDEX IF NOT EXISTS idx_establishments_stripe_customer_id ON establishments(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_establishments_subscription_status ON establishments(subscription_status);

-- Add comment to columns
COMMENT ON COLUMN establishments.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN establishments.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN establishments.subscription_status IS 'Status: trialing, active, past_due, canceled, unpaid, incomplete, incomplete_expired';
COMMENT ON COLUMN establishments.plan_type IS 'Plan type: free_trial, monthly, yearly, expired';
COMMENT ON COLUMN establishments.trial_end_date IS 'Date when the free trial ends (30 days from signup)';
COMMENT ON COLUMN establishments.current_period_end IS 'Current billing period end date';

-- Function to check if trial has expired
CREATE OR REPLACE FUNCTION is_trial_expired(establishment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trial_end TIMESTAMPTZ;
  sub_status TEXT;
BEGIN
  SELECT trial_end_date, subscription_status
  INTO trial_end, sub_status
  FROM establishments
  WHERE id = establishment_id;
  
  -- If has active subscription, trial status doesn't matter
  IF sub_status IN ('active', 'trialing') THEN
    RETURN FALSE;
  END IF;
  
  -- Check if trial has expired
  IF trial_end IS NOT NULL AND trial_end < NOW() THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update subscription status when trial expires
CREATE OR REPLACE FUNCTION update_expired_trials()
RETURNS void AS $$
BEGIN
  UPDATE establishments
  SET 
    subscription_status = 'expired',
    plan_type = 'expired'
  WHERE 
    trial_end_date < NOW()
    AND subscription_status = 'trialing'
    AND stripe_subscription_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run daily (requires pg_cron extension)
-- Note: This needs to be run manually in Supabase SQL Editor with proper permissions
-- SELECT cron.schedule(
--   'update-expired-trials',
--   '0 0 * * *', -- Run at midnight every day
--   'SELECT update_expired_trials();'
-- );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_trial_expired TO authenticated;
GRANT EXECUTE ON FUNCTION update_expired_trials TO authenticated;
