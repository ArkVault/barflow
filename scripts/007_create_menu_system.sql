-- ============================================
-- MENU SYSTEM FOR PRODUCTS
-- ============================================

-- Create menus table
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add menu_id to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menus_establishment ON public.menus(establishment_id);
CREATE INDEX IF NOT EXISTS idx_menus_active ON public.menus(establishment_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_menu ON public.products(menu_id);

-- Add comments
COMMENT ON TABLE public.menus IS 'Different menus for the establishment (e.g., Summer Menu, Winter Menu, etc.)';
COMMENT ON COLUMN public.menus.is_active IS 'Only one menu can be active at a time per establishment';
COMMENT ON COLUMN public.products.menu_id IS 'Menu this product belongs to';

-- Enable RLS
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menus
CREATE POLICY "Users can view menus from their establishment"
  ON public.menus
  FOR SELECT
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create menus in their establishment"
  ON public.menus
  FOR INSERT
  WITH CHECK (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update menus in their establishment"
  ON public.menus
  FOR UPDATE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete menus in their establishment"
  ON public.menus
  FOR DELETE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Function to ensure only one active menu per establishment
CREATE OR REPLACE FUNCTION ensure_single_active_menu()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this menu as active, deactivate all others in the same establishment
  IF NEW.is_active = true THEN
    UPDATE public.menus
    SET is_active = false, updated_at = NOW()
    WHERE establishment_id = NEW.establishment_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one active menu
DROP TRIGGER IF EXISTS trigger_ensure_single_active_menu ON public.menus;

CREATE TRIGGER trigger_ensure_single_active_menu
BEFORE INSERT OR UPDATE ON public.menus
FOR EACH ROW
EXECUTE FUNCTION ensure_single_active_menu();

-- Create default menu for existing establishments
INSERT INTO public.menus (establishment_id, name, is_active)
SELECT DISTINCT establishment_id, 'Menú Principal', true
FROM public.products
WHERE establishment_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Assign existing products to the default menu
UPDATE public.products p
SET menu_id = (
  SELECT id FROM public.menus m
  WHERE m.establishment_id = p.establishment_id
    AND m.name = 'Menú Principal'
  LIMIT 1
)
WHERE menu_id IS NULL
  AND establishment_id IS NOT NULL;
