# 🔒 HABILITAR ROW-LEVEL SECURITY (RLS) EN SUPABASE

## ⚠️ PROBLEMA DE SEGURIDAD CRÍTICO

**Tus tablas NO tienen Row-Level Security (RLS) habilitado**, lo que significa:
- ❌ Cualquier usuario autenticado puede ver TODOS los datos de TODOS los usuarios
- ❌ Un usuario podría modificar o eliminar datos de otros usuarios
- ❌ No hay aislamiento de datos entre establecimientos
- ❌ **RIESGO CRÍTICO DE SEGURIDAD**

## ✅ SOLUCIÓN: Habilitar RLS con Políticas

### ¿Qué hace esta migración?

1. **Habilita RLS** en todas las tablas públicas
2. **Crea políticas** que aseguran que:
   - Los usuarios solo ven SUS propios establecimientos
   - Los usuarios solo ven datos de SUS establecimientos
   - No pueden acceder a datos de otros usuarios
   - Cada operación (SELECT, INSERT, UPDATE, DELETE) está protegida

### Tablas que se protegerán:

- ✅ `establishments` - Establecimientos
- ✅ `supplies` - Insumos
- ✅ `products` - Productos
- ✅ `product_ingredients` - Ingredientes de productos
- ✅ `sales` - Ventas
- ✅ `menus` - Menús
- ✅ `inventory_logs` - Logs de inventario

---

## 📋 PASOS PARA EJECUTAR

### Paso 1: Abrir SQL Editor

Ve a: https://app.supabase.com/project/bwhqivcdvvqrqawbhnof/sql/new

### Paso 2: Copiar el SQL

Abre el archivo:
```
supabase/migrations/enable_rls_all_tables.sql
```

Y copia TODO su contenido.

### Paso 3: Ejecutar

1. Pega el SQL en el editor
2. Haz clic en **"Run"**
3. Espera a que termine (puede tomar 10-20 segundos)
4. Deberías ver mensajes como:
   ```
   NOTICE: RLS enabled on: establishments
   NOTICE: RLS enabled on: supplies
   NOTICE: RLS enabled on: products
   ...
   ```

### Paso 4: Verificar

Ejecuta esta query para confirmar que RLS está habilitado:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Todas las tablas deben mostrar `rls_enabled = true` ✅

---

## 🔍 ¿Qué Hacen las Políticas?

### Ejemplo: Tabla `supplies`

**Antes (SIN RLS):**
```sql
-- Usuario A puede ver TODOS los insumos de TODOS los usuarios
SELECT * FROM supplies;  -- ❌ Ve TODO
```

**Después (CON RLS):**
```sql
-- Usuario A solo ve SUS propios insumos
SELECT * FROM supplies;  -- ✅ Solo ve sus datos
```

### Cómo Funciona:

Cada política verifica:
```sql
establishment_id IN (
  SELECT id FROM establishments WHERE user_id = auth.uid()
)
```

Esto asegura que solo accedas a datos de TUS establecimientos.

---

## 🧪 Probar que Funciona

### Test 1: Crear un nuevo usuario

1. Regístrate con un email diferente
2. Crea algunos insumos
3. Cierra sesión

### Test 2: Verificar aislamiento

1. Inicia sesión con tu usuario original
2. Ve a la página de insumos
3. **NO deberías ver** los insumos del otro usuario ✅

---

## ⚠️ IMPORTANTE

### Después de ejecutar esta migración:

✅ **Ventajas:**
- Datos completamente aislados por usuario
- Seguridad a nivel de base de datos
- Cumplimiento con mejores prácticas
- Protección contra acceso no autorizado

⚠️ **Consideraciones:**
- Si tienes datos de prueba de otros usuarios, ya no los verás
- Esto es CORRECTO y ESPERADO
- Cada usuario solo debe ver sus propios datos

### Si algo falla:

Si después de ejecutar la migración algo no funciona:
1. Revisa los logs de Supabase
2. Verifica que el `user_id` en `establishments` coincida con `auth.uid()`
3. Comparte el error conmigo para ayudarte

---

## 📊 Resumen de Políticas

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| establishments | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| supplies | ✅ Own Est | ✅ Own Est | ✅ Own Est | ✅ Own Est |
| products | ✅ Own Est | ✅ Own Est | ✅ Own Est | ✅ Own Est |
| product_ingredients | ✅ Own Prod | ✅ Own Prod | ✅ Own Prod | ✅ Own Prod |
| sales | ✅ Own Est | ✅ Own Est | ✅ Own Est | ✅ Own Est |
| menus | ✅ Own Est | ✅ Own Est | ✅ Own Est | ✅ Own Est |
| inventory_logs | ✅ Own Est | ✅ Own Est | ✅ Own Est | ✅ Own Est |

**Own** = Solo tus registros
**Own Est** = Solo registros de tus establecimientos
**Own Prod** = Solo ingredientes de tus productos

---

## 🚀 Ejecuta Ahora

Esta migración es **CRÍTICA** para la seguridad de tu aplicación. 

**Ejecuta el SQL ahora y confirma que funcionó** ✅
