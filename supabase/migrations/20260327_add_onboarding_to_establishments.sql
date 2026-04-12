-- Add onboarding tracking fields to establishments
ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.establishments.onboarding_completed IS 'Whether the user has completed the onboarding wizard';
COMMENT ON COLUMN public.establishments.onboarding_data IS 'JSON data from onboarding: roles, branchType, inventoryMethod';
