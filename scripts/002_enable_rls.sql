-- Enable Row Level Security on all tables
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own establishments" ON public.establishments;
DROP POLICY IF EXISTS "Users can insert their own establishments" ON public.establishments;
DROP POLICY IF EXISTS "Users can update their own establishments" ON public.establishments;
DROP POLICY IF EXISTS "Users can delete their own establishments" ON public.establishments;

DROP POLICY IF EXISTS "Users can view supplies from their establishments" ON public.supplies;
DROP POLICY IF EXISTS "Users can insert supplies to their establishments" ON public.supplies;
DROP POLICY IF EXISTS "Users can update supplies in their establishments" ON public.supplies;
DROP POLICY IF EXISTS "Users can delete supplies from their establishments" ON public.establishments;

-- ESTABLISHMENTS TABLE POLICIES
-- Users can view their own establishments
CREATE POLICY "Users can view their own establishments"
  ON public.establishments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own establishments
CREATE POLICY "Users can insert their own establishments"
  ON public.establishments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own establishments
CREATE POLICY "Users can update their own establishments"
  ON public.establishments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own establishments
CREATE POLICY "Users can delete their own establishments"
  ON public.establishments
  FOR DELETE
  USING (auth.uid() = user_id);

-- SUPPLIES TABLE POLICIES
-- Users can view supplies from their establishments
CREATE POLICY "Users can view supplies from their establishments"
  ON public.supplies
  FOR SELECT
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Users can insert supplies to their establishments
CREATE POLICY "Users can insert supplies to their establishments"
  ON public.supplies
  FOR INSERT
  WITH CHECK (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Users can update supplies in their establishments
CREATE POLICY "Users can update supplies in their establishments"
  ON public.supplies
  FOR UPDATE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Users can delete supplies from their establishments
CREATE POLICY "Users can delete supplies from their establishments"
  ON public.supplies
  FOR DELETE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- SUPPLY_MOVEMENTS TABLE POLICIES
CREATE POLICY "Users can view movements from their establishments"
  ON public.supply_movements
  FOR SELECT
  USING (
    supply_id IN (
      SELECT s.id FROM public.supplies s
      INNER JOIN public.establishments e ON s.establishment_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert movements to their establishments"
  ON public.supply_movements
  FOR INSERT
  WITH CHECK (
    supply_id IN (
      SELECT s.id FROM public.supplies s
      INNER JOIN public.establishments e ON s.establishment_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

-- PRODUCTS TABLE POLICIES
CREATE POLICY "Users can manage products in their establishments"
  ON public.products
  FOR ALL
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- PRODUCT_INGREDIENTS TABLE POLICIES
CREATE POLICY "Users can manage ingredients in their establishments"
  ON public.product_ingredients
  FOR ALL
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      INNER JOIN public.establishments e ON p.establishment_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

-- SALES TABLE POLICIES
CREATE POLICY "Users can manage sales in their establishments"
  ON public.sales
  FOR ALL
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- PROJECTIONS TABLE POLICIES
CREATE POLICY "Users can manage projections in their establishments"
  ON public.projections
  FOR ALL
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance with RLS
CREATE INDEX IF NOT EXISTS idx_establishments_user_id ON public.establishments(user_id);
CREATE INDEX IF NOT EXISTS idx_supplies_establishment_user ON public.supplies(establishment_id);
CREATE INDEX IF NOT EXISTS idx_products_establishment_user ON public.products(establishment_id);
CREATE INDEX IF NOT EXISTS idx_sales_establishment_user ON public.sales(establishment_id);
CREATE INDEX IF NOT EXISTS idx_projections_establishment_user ON public.projections(establishment_id);
