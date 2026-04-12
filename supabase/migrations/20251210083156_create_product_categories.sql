-- Create product_categories table
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for reading categories (public)
CREATE POLICY "Anyone can view product categories"
  ON public.product_categories FOR SELECT
  USING (true);

-- Create policy for inserting categories (authenticated users)
CREATE POLICY "Authenticated users can insert categories"
  ON public.product_categories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy for updating categories (authenticated users)
CREATE POLICY "Authenticated users can update categories"
  ON public.product_categories FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Insert default categories
INSERT INTO public.product_categories (name, description, icon, display_order) VALUES
  ('Cócteles', 'Bebidas alcohólicas mixtas', '🍹', 1),
  ('Cervezas', 'Cervezas nacionales e importadas', '🍺', 2),
  ('Vinos', 'Vinos tintos, blancos y rosados', '🍷', 3),
  ('Shots', 'Bebidas alcohólicas en shot', '🥃', 4),
  ('Bebidas sin alcohol', 'Refrescos, jugos y bebidas no alcohólicas', '🥤', 5),
  ('Alimentos', 'Comida y botanas', '🍔', 6),
  ('Postres', 'Postres y dulces', '🍰', 7),
  ('Entradas', 'Entradas y aperitivos', '🥗', 8)
ON CONFLICT (name) DO NOTHING;

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Add comment
COMMENT ON TABLE public.product_categories IS 'Categories for products (drinks, food, etc.)';
