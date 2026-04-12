-- Create menus table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on menus
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view menus from their establishment" ON public.menus;
DROP POLICY IF EXISTS "Users can insert menus to their establishment" ON public.menus;
DROP POLICY IF EXISTS "Users can update menus from their establishment" ON public.menus;
DROP POLICY IF EXISTS "Users can delete menus from their establishment" ON public.menus;
DROP POLICY IF EXISTS "Users can view products from their menus" ON public.products;
DROP POLICY IF EXISTS "Users can insert products to their menus" ON public.products;
DROP POLICY IF EXISTS "Users can update products from their menus" ON public.products;
DROP POLICY IF EXISTS "Users can delete products from their menus" ON public.products;

-- RLS Policies for menus
CREATE POLICY "Users can view menus from their establishment"
  ON public.menus FOR SELECT
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert menus to their establishment"
  ON public.menus FOR INSERT
  WITH CHECK (
    establishment_id IN (
      SELECT id FROM public.establishments
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update menus from their establishment"
  ON public.menus FOR UPDATE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete menus from their establishment"
  ON public.menus FOR DELETE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for products
CREATE POLICY "Users can view products from their menus"
  ON public.products FOR SELECT
  USING (
    menu_id IN (
      SELECT m.id FROM public.menus m
      INNER JOIN public.establishments e ON m.establishment_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products to their menus"
  ON public.products FOR INSERT
  WITH CHECK (
    menu_id IN (
      SELECT m.id FROM public.menus m
      INNER JOIN public.establishments e ON m.establishment_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products from their menus"
  ON public.products FOR UPDATE
  USING (
    menu_id IN (
      SELECT m.id FROM public.menus m
      INNER JOIN public.establishments e ON m.establishment_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products from their menus"
  ON public.products FOR DELETE
  USING (
    menu_id IN (
      SELECT m.id FROM public.menus m
      INNER JOIN public.establishments e ON m.establishment_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

-- Add updated_at triggers
DROP TRIGGER IF EXISTS handle_updated_at_menus ON public.menus;
DROP TRIGGER IF EXISTS handle_updated_at_products ON public.products;

CREATE TRIGGER handle_updated_at_menus BEFORE UPDATE ON public.menus
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_products BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_menus_establishment_id ON public.menus(establishment_id);
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON public.menus(is_active);
CREATE INDEX IF NOT EXISTS idx_products_menu_id ON public.products(menu_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Add comments
COMMENT ON TABLE public.menus IS 'Menus for each establishment';
COMMENT ON TABLE public.products IS 'Products (drinks, food, etc.) for each menu';
