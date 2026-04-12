-- Migration: Enable Row-Level Security (RLS) on all public tables
-- Description: Enables RLS and creates policies to ensure users can only access their own data

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Enable RLS on establishments
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on supplies (insumos)
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product_ingredients
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Enable RLS on menus
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Enable RLS on inventory_logs
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ESTABLISHMENTS POLICIES
-- ============================================================================

-- Users can view their own establishments
CREATE POLICY "Users can view own establishments"
ON public.establishments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own establishments
CREATE POLICY "Users can insert own establishments"
ON public.establishments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own establishments
CREATE POLICY "Users can update own establishments"
ON public.establishments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own establishments
CREATE POLICY "Users can delete own establishments"
ON public.establishments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- SUPPLIES POLICIES
-- ============================================================================

-- Users can view supplies from their establishments
CREATE POLICY "Users can view own supplies"
ON public.supplies
FOR SELECT
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can insert supplies to their establishments
CREATE POLICY "Users can insert own supplies"
ON public.supplies
FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can update supplies from their establishments
CREATE POLICY "Users can update own supplies"
ON public.supplies
FOR UPDATE
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can delete supplies from their establishments
CREATE POLICY "Users can delete own supplies"
ON public.supplies
FOR DELETE
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================

-- Users can view products from their establishments
CREATE POLICY "Users can view own products"
ON public.products
FOR SELECT
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can insert products to their establishments
CREATE POLICY "Users can insert own products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can update products from their establishments
CREATE POLICY "Users can update own products"
ON public.products
FOR UPDATE
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can delete products from their establishments
CREATE POLICY "Users can delete own products"
ON public.products
FOR DELETE
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- PRODUCT_INGREDIENTS POLICIES
-- ============================================================================

-- Users can view ingredients from their products
CREATE POLICY "Users can view own product ingredients"
ON public.product_ingredients
FOR SELECT
TO authenticated
USING (
  product_id IN (
    SELECT id FROM public.products 
    WHERE establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  )
);

-- Users can insert ingredients to their products
CREATE POLICY "Users can insert own product ingredients"
ON public.product_ingredients
FOR INSERT
TO authenticated
WITH CHECK (
  product_id IN (
    SELECT id FROM public.products 
    WHERE establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  )
);

-- Users can update ingredients from their products
CREATE POLICY "Users can update own product ingredients"
ON public.product_ingredients
FOR UPDATE
TO authenticated
USING (
  product_id IN (
    SELECT id FROM public.products 
    WHERE establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  product_id IN (
    SELECT id FROM public.products 
    WHERE establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  )
);

-- Users can delete ingredients from their products
CREATE POLICY "Users can delete own product ingredients"
ON public.product_ingredients
FOR DELETE
TO authenticated
USING (
  product_id IN (
    SELECT id FROM public.products 
    WHERE establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- SALES POLICIES
-- ============================================================================

-- Users can view sales from their establishments
CREATE POLICY "Users can view own sales"
ON public.sales
FOR SELECT
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can insert sales to their establishments
CREATE POLICY "Users can insert own sales"
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can update sales from their establishments
CREATE POLICY "Users can update own sales"
ON public.sales
FOR UPDATE
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can delete sales from their establishments
CREATE POLICY "Users can delete own sales"
ON public.sales
FOR DELETE
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- MENUS POLICIES
-- ============================================================================

-- Users can view menus from their establishments
CREATE POLICY "Users can view own menus"
ON public.menus
FOR SELECT
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can insert menus to their establishments
CREATE POLICY "Users can insert own menus"
ON public.menus
FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can update menus from their establishments
CREATE POLICY "Users can update own menus"
ON public.menus
FOR UPDATE
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can delete menus from their establishments
CREATE POLICY "Users can delete own menus"
ON public.menus
FOR DELETE
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- INVENTORY_LOGS POLICIES
-- ============================================================================

-- Users can view inventory logs from their establishments
CREATE POLICY "Users can view own inventory logs"
ON public.inventory_logs
FOR SELECT
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can insert inventory logs to their establishments
CREATE POLICY "Users can insert own inventory logs"
ON public.inventory_logs
FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can update inventory logs from their establishments
CREATE POLICY "Users can update own inventory logs"
ON public.inventory_logs
FOR UPDATE
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Users can delete inventory logs from their establishments
CREATE POLICY "Users can delete own inventory logs"
ON public.inventory_logs
FOR DELETE
TO authenticated
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled on all tables
DO $$
DECLARE
  table_name text;
  rls_enabled boolean;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = table_name;
    
    IF rls_enabled THEN
      RAISE NOTICE 'RLS enabled on: %', table_name;
    ELSE
      RAISE WARNING 'RLS NOT enabled on: %', table_name;
    END IF;
  END LOOP;
END $$;
