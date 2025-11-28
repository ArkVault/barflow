# ✅ Confirmación: Sistema de Menús en Supabase

## 📊 **Estructura de Base de Datos**

### **Tabla: menus**
```sql
- id (UUID) - Primary Key
- establishment_id (UUID) - FK to establishments
- name (VARCHAR) - Nombre del menú
- is_active (BOOLEAN) - Solo uno activo por establecimiento
- created_at, updated_at (TIMESTAMP)
```

### **Tabla: products**
```sql
- id (UUID) - Primary Key
- establishment_id (UUID) - FK to establishments
- menu_id (UUID) - FK to menus ✅ AGREGADO
- name, category, price, etc.
```

### **Índices Creados**
```sql
✅ idx_menus_establishment - Para buscar menús por establecimiento
✅ idx_menus_active - Para encontrar menú activo rápidamente
✅ idx_products_menu - Para filtrar productos por menú
```

## ✅ **Lógica Confirmada**

### **1. Cargar Productos con menu_id**
```typescript
const { data: products } = await supabase
  .from('products')
  .select('*')
  .eq('establishment_id', establishmentId)
  .eq('menu_id', activeMenuId); // ✅ Filtro por menú
```

### **2. Filtrar WHERE menu_id = activeMenuId**
```sql
SELECT * FROM products 
WHERE establishment_id = 'xxx'
  AND menu_id = 'yyy'; -- ✅ Índice optimizado
```

### **3. Asignar Nuevos Productos al Menú Activo**
```typescript
const { data: activeMenu } = await supabase
  .from('menus')
  .select('id')
  .eq('establishment_id', establishmentId)
  .eq('is_active', true)
  .single();

// Al crear producto:
await supabase
  .from('products')
  .insert({
    name: 'Mojito',
    menu_id: activeMenu.id, // ✅ Asignado automáticamente
    establishment_id: establishmentId,
    // ... otros campos
  });
```

### **4. Mostrar Contador de Productos por Menú**
```typescript
// Opción A: Count directo
const { count } = await supabase
  .from('products')
  .select('*', { count: 'exact', head: true })
  .eq('menu_id', menuId);

// Opción B: Con los menús
const { data: menus } = await supabase
  .from('menus')
  .select(`
    *,
    products:products(count)
  `)
  .eq('establishment_id', establishmentId);
```

## 🔄 **Flujo Completo**

### **Escenario 1: Usuario Activa Menú**
```
1. Usuario hace clic en "Activar" en "Menú Verano 2025"
   ↓
2. UPDATE menus SET is_active = true WHERE id = 'menu-verano-id'
   ↓
3. Trigger desactiva otros menús automáticamente
   ↓
4. Frontend recarga productos:
   SELECT * FROM products WHERE menu_id = 'menu-verano-id'
   ↓
5. Grid muestra solo productos de ese menú
```

### **Escenario 2: Usuario Crea Producto**
```
1. Usuario hace clic en "Agregar Producto"
   ↓
2. Sistema obtiene menú activo:
   SELECT id FROM menus WHERE is_active = true
   ↓
3. Producto se crea con menu_id del menú activo:
   INSERT INTO products (name, menu_id, ...) VALUES (...)
   ↓
4. Producto aparece automáticamente en el menú activo
```

### **Escenario 3: Usuario Cambia de Menú**
```
1. Menú Actual: "Menú Verano" (10 productos)
   ↓
2. Usuario activa "Menú Invierno"
   ↓
3. Frontend filtra: WHERE menu_id = 'menu-invierno-id'
   ↓
4. Grid muestra productos de "Menú Invierno" (5 productos)
```

## ✅ **Migraciones Ejecutadas**

```sql
✅ Tabla menus creada
✅ Columna menu_id agregada a products
✅ Índices creados para optimización
✅ RLS policies implementadas
✅ Trigger ensure_single_active_menu activo
✅ Menú "Menú Principal" creado para establecimientos existentes
✅ Productos existentes asignados a "Menú Principal"
```

## 📝 **Queries de Ejemplo**

### **Obtener Menú Activo**
```sql
SELECT * FROM menus 
WHERE establishment_id = 'xxx' 
  AND is_active = true;
```

### **Obtener Productos del Menú Activo**
```sql
SELECT p.* FROM products p
JOIN menus m ON p.menu_id = m.id
WHERE m.establishment_id = 'xxx'
  AND m.is_active = true;
```

### **Contar Productos por Menú**
```sql
SELECT 
  m.id,
  m.name,
  m.is_active,
  COUNT(p.id) as product_count
FROM menus m
LEFT JOIN products p ON p.menu_id = m.id
WHERE m.establishment_id = 'xxx'
GROUP BY m.id, m.name, m.is_active;
```

## 🎯 **Confirmación Final**

✅ **Estructura de Supabase**: Correcta y optimizada
✅ **Lógica de Filtrado**: Implementada con índices
✅ **Asignación Automática**: Al menú activo
✅ **Contador de Productos**: Queries preparadas
✅ **RLS Policies**: Seguridad implementada
✅ **Triggers**: Funcionando correctamente

**TODO LISTO PARA USAR** 🚀
