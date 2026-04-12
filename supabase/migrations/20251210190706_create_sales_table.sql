-- Create sales table to store paid orders
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  table_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing sales (users can only see their establishment's sales)
CREATE POLICY "Users can view their establishment sales"
  ON public.sales FOR SELECT
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Create policy for inserting sales
CREATE POLICY "Users can insert sales for their establishment"
  ON public.sales FOR INSERT
  WITH CHECK (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Create policy for updating sales
CREATE POLICY "Users can update their establishment sales"
  ON public.sales FOR UPDATE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Create policy for deleting sales
CREATE POLICY "Users can delete their establishment sales"
  ON public.sales FOR DELETE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_sales_establishment_id ON public.sales(establishment_id);
CREATE INDEX idx_sales_created_at ON public.sales(created_at DESC);

-- Add comment
COMMENT ON TABLE public.sales IS 'Stores completed sales/paid orders from operations';
