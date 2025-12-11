# Aplicar Migración de Menus y Products en Supabase

## 📋 Pasos para Aplicar la Migración

### 1. Acceder a Supabase Dashboard
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto de Barflow
3. En el menú lateral, haz click en **SQL Editor**

### 2. Crear Nueva Query
1. Click en **+ New query**
2. Copia y pega el siguiente SQL completo:

```sql
-- Create menus table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on menus
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view menus from their establishment" ON public.menus;
DROP POLICY IF EXISTS "Users can insert menus to their establishment" ON public.menus;
DROP POLICY IF EXISTS "Users can update menus from their establishment" ON public.menus;
DROP POLICY IF EXISTS "Users can delete menus from their establishment" ON public.menus;
DROP POLICY IF EXISTS "Users can view products from their menus" ON public.products;
DROP POLICY IF EXISTS "Users can insert products to their menus" ON public.products;
DROP POLICY IF EXISTS "Users can update products from their menus" ON public.products;
DROP POLICY IF EXISTS "Users can delete products from their menus" ON public.products;

-- RLS Policies for menus
CREATE POLICY "Users can view menus from their establishment"
  ON public.menus FOR SELECT
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert menus to their establishment"
  ON public.menus FOR INSERT
  WITH CHECK (
    establishment_id IN (
      SELECT id FROM public.establishments
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update menus from their establishment"
  ON public.menus FOR UPDATE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete menus from their establishment"
  ON public.menus FOR DELETE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for products
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

-- Add updated_at triggers
DROP TRIGGER IF EXISTS handle_updated_at_menus ON public.menus;
DROP TRIGGER IF EXISTS handle_updated_at_products ON public.products;

CREATE TRIGGER handle_updated_at_menus BEFORE UPDATE ON public.menus
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_products BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_menus_establishment_id ON public.menus(establishment_id);
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON public.menus(is_active);
CREATE INDEX IF NOT EXISTS idx_products_menu_id ON public.products(menu_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Add comments
COMMENT ON TABLE public.menus IS 'Menus for each establishment';
COMMENT ON TABLE public.products IS 'Products (drinks, food, etc.) for each menu';
```

### 3. Ejecutar la Migración
1. Click en el botón **Run** (o presiona `Ctrl/Cmd + Enter`)
2. Espera a que se complete la ejecución
3. Deberías ver un mensaje de éxito: **Success. No rows returned**

### 4. Verificar las Tablas
1. En el menú lateral, ve a **Table Editor**
2. Deberías ver las nuevas tablas:
   - ✅ `menus`
   - ✅ `products`

### 5. Verificar las Políticas RLS
1. En el menú lateral, ve a **Authentication** > **Policies**
2. Busca las tablas `menus` y `products`
3. Deberías ver 4 políticas para cada tabla:
   - ✅ Users can view...
   - ✅ Users can insert...
   - ✅ Users can update...
   - ✅ Users can delete...

## ✅ Verificación Final

Después de aplicar la migración:

1. Ve a tu aplicación en `/productos`
2. Intenta crear un nuevo producto
3. Ahora debería funcionar correctamente
4. Revisa la consola para ver los mensajes de error detallados (si los hay)

## 🔍 Si Hay Errores

Si ves algún error al ejecutar la migración:

1. **Error: relation "menus" already exists**
   - Esto es normal si las tablas ya existen
   - La migración usa `CREATE TABLE IF NOT EXISTS`, así que es seguro

2. **Error: policy already exists**
   - La migración incluye `DROP POLICY IF EXISTS`
   - Ejecuta la migración de nuevo

3. **Error: function handle_updated_at() does not exist**
   - Esta función debería existir de migraciones anteriores
   - Si no existe, avísame y te ayudo a crearla

## 📞 Soporte

Si encuentras algún problema, revisa:
- Los logs de la consola del navegador
- Los mensajes de error en Supabase Dashboard
- El mensaje de toast en la aplicación

¡La migración debería resolver el error de inserción de productos! 🎉
