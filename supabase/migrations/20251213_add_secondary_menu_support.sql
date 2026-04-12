-- ============================================
-- ADD SECONDARY ACTIVE MENU SUPPORT
-- Allows two menus to be active simultaneously
-- ============================================

-- Add is_secondary_active column to menus table
ALTER TABLE public.menus
ADD COLUMN IF NOT EXISTS is_secondary_active BOOLEAN DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN public.menus.is_secondary_active IS 'Secondary active menu - can be used alongside the primary active menu';

-- Create index for efficient querying of active menus
CREATE INDEX IF NOT EXISTS idx_menus_secondary_active ON public.menus(establishment_id, is_secondary_active);

-- Function to ensure only one secondary active menu per establishment
CREATE OR REPLACE FUNCTION ensure_single_secondary_active_menu()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this menu as secondary active, deactivate all others in the same establishment
  IF NEW.is_secondary_active = true THEN
    UPDATE public.menus
    SET is_secondary_active = false, updated_at = NOW()
    WHERE establishment_id = NEW.establishment_id
      AND id != NEW.id
      AND is_secondary_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_ensure_single_secondary_active_menu ON public.menus;

CREATE TRIGGER trigger_ensure_single_secondary_active_menu
BEFORE INSERT OR UPDATE ON public.menus
FOR EACH ROW
EXECUTE FUNCTION ensure_single_secondary_active_menu();
