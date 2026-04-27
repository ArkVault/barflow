-- Migration: Fix is_trial_expired() and update subscription_status comment
-- Purpose: is_trial_expired() only exempted 'active' and 'trialing', which means
-- users with 'canceling' or 'paused' status would be incorrectly locked out.
-- Also adds 'canceling' to the canonical status comment.

-- Update column comment to include all valid statuses
COMMENT ON COLUMN establishments.subscription_status IS
  'Status: trialing, active, past_due, canceled, canceling, unpaid, paused, requires_action, incomplete, incomplete_expired, expired';

-- Fix is_trial_expired() to exempt all paid/active statuses
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

  -- Any paid or in-flight subscription status means the user is NOT trial-expired
  IF sub_status IN ('active', 'trialing', 'canceling', 'paused', 'past_due', 'unpaid', 'requires_action') THEN
    RETURN FALSE;
  END IF;

  -- No active subscription — check whether the free trial window has passed
  IF trial_end IS NOT NULL AND trial_end < NOW() THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION is_trial_expired TO authenticated;
