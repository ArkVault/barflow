-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_establishments_updated_at
  BEFORE UPDATE ON public.establishments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplies_updated_at
  BEFORE UPDATE ON public.supplies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically deduct supplies when a sale is made
CREATE OR REPLACE FUNCTION process_sale_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- For each ingredient in the sold product, deduct from supplies
  INSERT INTO public.supply_movements (supply_id, movement_type, quantity, notes)
  SELECT 
    pi.supply_id,
    'consumed',
    -(pi.quantity_needed * NEW.quantity), -- negative for consumption
    'Venta automática: ' || (SELECT name FROM public.products WHERE id = NEW.product_id)
  FROM public.product_ingredients pi
  WHERE pi.product_id = NEW.product_id;

  -- Update current quantity in supplies
  UPDATE public.supplies s
  SET current_quantity = current_quantity - (pi.quantity_needed * NEW.quantity)
  FROM public.product_ingredients pi
  WHERE pi.product_id = NEW.product_id
    AND pi.supply_id = s.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to process inventory when sale is recorded
CREATE TRIGGER trigger_process_sale_inventory
  AFTER INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION process_sale_inventory();

-- Function to create default establishment for new users
CREATE OR REPLACE FUNCTION create_default_establishment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.establishments (user_id, name)
  VALUES (
    NEW.id,
    'Mi Establecimiento'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create establishment on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_establishment();
