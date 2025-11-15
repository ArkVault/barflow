-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Establishments table (bars/restaurants)
CREATE TABLE IF NOT EXISTS public.establishments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplies table (inventory items)
CREATE TABLE IF NOT EXISTS public.supplies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- licores, refrescos, frutas, especias, etc.
  unit TEXT NOT NULL, -- ml, g, unidad, etc.
  current_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  min_threshold DECIMAL(10, 2) NOT NULL DEFAULT 0, -- minimum stock level
  cost_per_unit DECIMAL(10, 2), -- cost in currency per unit
  supplier TEXT,
  last_received_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supply movements (transaction log)
CREATE TABLE IF NOT EXISTS public.supply_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL, -- 'received', 'consumed', 'adjusted', 'expired'
  quantity DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2), -- total cost for this movement
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (drinks/cocktails on menu)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- cocteles, cervezas, vinos, shots, etc.
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product ingredients (recipes)
CREATE TABLE IF NOT EXISTS public.product_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE CASCADE,
  quantity_needed DECIMAL(10, 2) NOT NULL, -- quantity of supply needed per product
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table (when products are sold)
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projections table (AI-generated forecasts)
CREATE TABLE IF NOT EXISTS public.projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE CASCADE,
  projection_period TEXT NOT NULL, -- 'day', 'week', 'month'
  predicted_consumption DECIMAL(10, 2) NOT NULL,
  recommended_order DECIMAL(10, 2),
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  projection_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplies_establishment ON public.supplies(establishment_id);
CREATE INDEX IF NOT EXISTS idx_supply_movements_supply ON public.supply_movements(supply_id);
CREATE INDEX IF NOT EXISTS idx_products_establishment ON public.products(establishment_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_product ON public.product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_establishment ON public.sales(establishment_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_projections_establishment ON public.projections(establishment_id);
