-- Performance indexes for scaling
-- Added: December 2024

-- Index for sales queries by date (most common filter)
CREATE INDEX IF NOT EXISTS idx_sales_created_at 
    ON public.sales (created_at DESC);

-- Index for sales by establishment + date (common query pattern)
CREATE INDEX IF NOT EXISTS idx_sales_establishment_date 
    ON public.sales (establishment_id, created_at DESC);

-- Index for supplies searches by establishment + name
CREATE INDEX IF NOT EXISTS idx_supplies_establishment_name 
    ON public.supplies (establishment_id, name);

-- Index for supplies by category (for filtering)
CREATE INDEX IF NOT EXISTS idx_supplies_establishment_category 
    ON public.supplies (establishment_id, category);

-- Index for products by menu + active status (common filter)
CREATE INDEX IF NOT EXISTS idx_products_menu_active 
    ON public.products (menu_id, is_active);

-- Index for products by category (for filtering in UI)
CREATE INDEX IF NOT EXISTS idx_products_menu_category 
    ON public.products (menu_id, category);

-- Index for menus by establishment (foreign key optimization)
CREATE INDEX IF NOT EXISTS idx_menus_establishment 
    ON public.menus (establishment_id);

-- Index for inventory logs by date (for reporting)
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at 
    ON public.inventory_logs (created_at DESC);

-- Index for inventory logs by supply (for tracking history)
CREATE INDEX IF NOT EXISTS idx_inventory_logs_supply 
    ON public.inventory_logs (supply_id, created_at DESC);

-- Comments for documentation
COMMENT ON INDEX idx_sales_created_at IS 'Optimizes date-range queries on sales';
COMMENT ON INDEX idx_sales_establishment_date IS 'Optimizes establishment + date queries';
COMMENT ON INDEX idx_supplies_establishment_name IS 'Optimizes supply search by name';
COMMENT ON INDEX idx_products_menu_active IS 'Optimizes active products listing';
