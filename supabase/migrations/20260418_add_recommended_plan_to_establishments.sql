-- Persist the plan recommended to the user during onboarding.
-- Read by Account > Subscription page (badge "Recomendado para ti")
-- and SubscriptionModal (pre-selects card + billing cycle).
--
-- Values mirror the PlanType enum in lib/stripe/config.ts:
--   starter_monthly | starter_yearly | business_monthly | business_yearly | chain | enterprise
-- NULL means: no recommendation computed yet (legacy users from before this migration).

ALTER TABLE establishments
  ADD COLUMN IF NOT EXISTS recommended_plan TEXT;

COMMENT ON COLUMN establishments.recommended_plan IS
  'Plan recommended at onboarding based on team size, branch count and inventory method. Mirrors PlanType.';
