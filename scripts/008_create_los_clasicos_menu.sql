-- ============================================
-- CREATE "LOS CLÁSICOS" MENU WITH PRODUCTS
-- ============================================

-- Insert Los Clásicos menu for all establishments
-- This creates a default menu with classic cocktails
INSERT INTO public.menus (establishment_id, name, is_active, created_at)
SELECT 
  id as establishment_id,
  'Los Clásicos' as name,
  false as is_active,
  NOW() as created_at
FROM public.establishments
WHERE NOT EXISTS (
  SELECT 1 FROM public.menus 
  WHERE establishment_id = establishments.id 
  AND name = 'Los Clásicos'
);

-- Get the menu IDs for inserting products
-- Note: You'll need to run the product inserts per establishment
-- For demo purposes, here's the template:

-- Example for a specific establishment (replace 'your-establishment-id'):
/*
INSERT INTO public.products (establishment_id, menu_id, name, category, price, description, active, created_at)
SELECT 
  'your-establishment-id',
  m.id,
  'Mojito',
  'Cócteles',
  8.50,
  'Refrescante cóctel cubano con hierbabuena y ron',
  true,
  NOW()
FROM public.menus m
WHERE m.establishment_id = 'your-establishment-id' 
  AND m.name = 'Los Clásicos';

-- Repeat for each cocktail...
*/

-- For demo/development, create a universal Los Clásicos menu
-- This will be available to all users
DO $$
DECLARE
  menu_record RECORD;
BEGIN
  -- For each establishment, create Los Clásicos menu if it doesn't exist
  FOR menu_record IN 
    SELECT id as establishment_id FROM public.establishments
  LOOP
    -- Insert menu
    INSERT INTO public.menus (establishment_id, name, is_active, created_at)
    VALUES (menu_record.establishment_id, 'Los Clásicos', false, NOW())
    ON CONFLICT DO NOTHING;
    
    -- Insert products for this menu
    INSERT INTO public.products (establishment_id, menu_id, name, category, price, description, is_active, created_at)
    SELECT 
      menu_record.establishment_id,
      m.id,
      cocktail.name,
      'Cócteles',
      cocktail.price,
      cocktail.description,
      true,
      NOW()
    FROM public.menus m
    CROSS JOIN (
      VALUES 
        ('Mojito', 8.50, 'Refrescante cóctel cubano con hierbabuena y ron'),
        ('Margarita', 9.00, 'Clásico cóctel mexicano con tequila y lima'),
        ('Piña Colada', 10.00, 'Tropical y cremoso cóctel caribeño'),
        ('Daiquiri', 8.00, 'Cóctel cubano clásico, simple y refrescante'),
        ('Cosmopolitan', 10.50, 'Elegante cóctel popularizado en los 90s'),
        ('Old Fashioned', 11.00, 'Cóctel clásico americano con whisky'),
        ('Manhattan', 10.50, 'Sofisticado cóctel de Nueva York'),
        ('Negroni', 9.50, 'Amargo y aromático cóctel italiano'),
        ('Martini', 11.50, 'El rey de los cócteles, elegante y seco'),
        ('Whisky Sour', 9.00, 'Equilibrio perfecto entre dulce y ácido'),
        ('Caipirinha', 8.00, 'Cóctel nacional de Brasil, fresco y potente'),
        ('Aperol Spritz', 8.50, 'Refrescante aperitivo italiano')
    ) AS cocktail(name, price, description)
    WHERE m.establishment_id = menu_record.establishment_id
      AND m.name = 'Los Clásicos'
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Verify the menus were created
SELECT 
  e.name as establishment_name,
  m.name as menu_name,
  m.is_active,
  COUNT(p.id) as product_count
FROM public.menus m
JOIN public.establishments e ON e.id = m.establishment_id
LEFT JOIN public.products p ON p.menu_id = m.id
WHERE m.name = 'Los Clásicos'
GROUP BY e.name, m.name, m.is_active
ORDER BY e.name;
