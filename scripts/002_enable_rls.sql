-- Enable Row Level Security on all tables
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projections ENABLE ROW LEVEL SECURITY;

-- Establishments policies (users can only access their own establishment)
CREATE POLICY "Users can view their own establishments"
  ON public.establishments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own establishments"
  ON public.establishments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own establishments"
  ON public.establishments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own establishments"
  ON public.establishments FOR DELETE
  USING (auth.uid() = user_id);

-- Supplies policies
CREATE POLICY "Users can view supplies from their establishments"
  ON public.supplies FOR SELECT
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert supplies to their establishments"
  ON public.supplies FOR INSERT
  WITH CHECK (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update supplies from their establishments"
  ON public.supplies FOR UPDATE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete supplies from their establishments"
  ON public.supplies FOR DELETE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Supply movements policies
CREATE POLICY "Users can view movements from their supplies"
  ON public.supply_movements FOR SELECT
  USING (
    supply_id IN (
      SELECT s.id FROM public.supplies s
      JOIN public.establishments e ON s.establishment_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert movements to their supplies"
  ON public.supply_movements FOR INSERT
  WITH CHECK (
    supply_id IN (
      SELECT s.id FROM public.supplies s
      JOIN public.establishments e ON s.establishment_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

-- Products policies
CREATE POLICY "Users can view products from their establishments"
  ON public.products FOR SELECT
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products to their establishments"
  ON public.products FOR INSERT
  WITH CHECK (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products from their establishments"
  ON public.products FOR UPDATE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products from their establishments"
  ON public.products FOR DELETE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Product ingredients policies
CREATE POLICY "Users can view ingredients from their products"
  ON public.product_ingredients FOR SELECT
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.establishments e ON p.establishment_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ingredients to their products"
  ON public.product_ingredients FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.establishments e ON p.establishment_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ingredients from their products"
  ON public.product_ingredients FOR UPDATE
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.establishments e ON p.establishment_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ingredients from their products"
  ON public.product_ingredients FOR DELETE
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.establishments e ON p.establishment_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

-- Sales policies
CREATE POLICY "Users can view sales from their establishments"
  ON public.sales FOR SELECT
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sales to their establishments"
  ON public.sales FOR INSERT
  WITH CHECK (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Projections policies
CREATE POLICY "Users can view projections from their establishments"
  ON public.projections FOR SELECT
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert projections to their establishments"
  ON public.projections FOR INSERT
  WITH CHECK (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );
