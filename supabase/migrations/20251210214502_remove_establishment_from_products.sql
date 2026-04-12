-- Drop all old policies that depend on establishment_id
-- Then remove establishment_id column from products

-- Drop all existing policies on products table
DROP POLICY IF EXISTS "Users can view products from their establishments" ON public.products;
DROP POLICY IF EXISTS "Users can insert products to their establishments" ON public.products;
DROP POLICY IF EXISTS "Users can update products from their establishments" ON public.products;
DROP POLICY IF EXISTS "Users can delete products from their establishments" ON public.products;
DROP POLICY IF EXISTS "Users can manage products in their establishments" ON public.products;
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
DROP POLICY IF EXISTS "Users can view products from their menus" ON public.products;
DROP POLICY IF EXISTS "Users can insert products to their menus" ON public.products;
DROP POLICY IF EXISTS "Users can update products from their menus" ON public.products;
DROP POLICY IF EXISTS "Users can delete products from their menus" ON public.products;

-- Drop all policies on product_ingredients if the table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_ingredients') THEN
        DROP POLICY IF EXISTS "Users can view ingredients from their products" ON public.product_ingredients;
        DROP POLICY IF EXISTS "Users can insert ingredients to their products" ON public.product_ingredients;
        DROP POLICY IF EXISTS "Users can update ingredients from their products" ON public.product_ingredients;
        DROP POLICY IF EXISTS "Users can delete ingredients from their products" ON public.product_ingredients;
        DROP POLICY IF EXISTS "Users can manage ingredients in their establishments" ON public.product_ingredients;
        DROP POLICY IF EXISTS "Users can view own product ingredients" ON public.product_ingredients;
        DROP POLICY IF EXISTS "Users can insert own product ingredients" ON public.product_ingredients;
        DROP POLICY IF EXISTS "Users can update own product ingredients" ON public.product_ingredients;
        DROP POLICY IF EXISTS "Users can delete own product ingredients" ON public.product_ingredients;
    END IF;
END $$;

-- Now we can safely drop the establishment_id column
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'establishment_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products 
        DROP COLUMN establishment_id CASCADE;
    END IF;
END $$;

-- Ensure menu_id exists and is properly configured
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'menu_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE;
    ELSE
        -- Ensure it has the correct constraint
        ALTER TABLE public.products 
        DROP CONSTRAINT IF EXISTS products_menu_id_fkey;
        
        ALTER TABLE public.products 
        ADD CONSTRAINT products_menu_id_fkey 
        FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create new RLS policies based on menu_id
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
