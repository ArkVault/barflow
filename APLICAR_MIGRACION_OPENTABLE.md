# 🔧 APLICAR MIGRACIÓN DE OPENTABLE

## ⚠️ Error Actual
```
Error connecting OpenTable: {}
```

**Causa:** La tabla `opentable_integrations` no existe en la base de datos.

## ✅ Solución: Aplicar Migración SQL

### **Opción 1: Dashboard de Supabase (Recomendado)**

1. **Ir a Supabase Dashboard:**
   - https://supabase.com/dashboard/project/bwhqivcdvvqrqawbhnof

2. **Ir a SQL Editor:**
   - Click en "SQL Editor" en el menú lateral

3. **Crear Nueva Query:**
   - Click en "+ New query"

4. **Copiar y Pegar el SQL:**
   - Abrir: `supabase/migrations/20251214_create_opentable_integration.sql`
   - Copiar TODO el contenido
   - Pegar en el editor SQL

5. **Ejecutar:**
   - Click en "Run" o presionar `Ctrl/Cmd + Enter`

6. **Verificar:**
   - Deberías ver: "Success. No rows returned"
   - Ir a "Table Editor" → Deberías ver las nuevas tablas:
     - `opentable_integrations`
     - `opentable_table_mappings`
     - `reservations`

### **Opción 2: Supabase CLI (Si tienes Docker)**

```bash
# 1. Iniciar Supabase local
supabase start

# 2. Aplicar migración
supabase db push

# 3. Verificar
supabase db diff
```

---

## 📋 Tablas que se Crearán

1. **`opentable_integrations`**
   - Guarda credenciales OAuth por establecimiento
   - Estado de conexión
   - Info del restaurante

2. **`opentable_table_mappings`**
   - Mapeo de mesas OpenTable ↔ Sistema interno

3. **`reservations`**
   - Todas las reservaciones
   - Múltiples fuentes (OpenTable, manual, teléfono, etc.)
   - Historial completo

---

## 🧪 Después de Aplicar la Migración

1. **Recargar la página** `/dashboard/cuenta`
2. **Ir a pestaña "Conexiones"**
3. **Click en "Conectar OpenTable"**
4. **Debería funcionar sin errores** ✅

---

## 🔍 Verificar que Funcionó

```sql
-- Ejecutar en SQL Editor de Supabase
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('opentable_integrations', 'opentable_table_mappings', 'reservations');
```

Deberías ver las 3 tablas listadas.

---

## 📝 Notas

- La migración es **idempotente** (usa `CREATE TABLE IF NOT EXISTS`)
- Puedes ejecutarla múltiples veces sin problemas
- Incluye RLS policies para seguridad
- Incluye índices para rendimiento
