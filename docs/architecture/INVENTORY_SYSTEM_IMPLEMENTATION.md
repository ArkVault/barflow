# Sistema de Contenido de Insumos y Resta Automática de Inventario

## Resumen
Implementación de un sistema que:
1. Agrega campo "Contenido" a insumos (ej: 750ml por botella)
2. Permite especificar marca/insumo exacto en productos
3. Resta automáticamente del inventario al registrar ventas

## Cambios en Base de Datos

### 1. Tabla `supplies` - Agregar campos de contenido
```sql
-- Ya creado en: scripts/005_add_supply_content.sql
ALTER TABLE supplies 
ADD COLUMN content_per_unit DECIMAL(10, 2) DEFAULT 1.0,
ADD COLUMN content_unit VARCHAR(50) DEFAULT 'ml';
```

**Ejemplo:**
- Botella de Ron: `content_per_unit = 750`, `content_unit = 'ml'`
- Si tengo 2 botellas: `current_quantity = 1500` (750ml × 2)

### 2. Tabla `product_ingredients` - Especificar marca exacta
```sql
-- Modificar para incluir supply_id exacto
ALTER TABLE product_ingredients
ADD COLUMN supply_id UUID REFERENCES supplies(id);

-- Esto permite match exacto: "Ron Bacardi 750ml" vs "Ron Havana Club 750ml"
```

### 3. Tabla `sales` - Trigger para resta automática
```sql
-- Crear función que se ejecuta al insertar venta
CREATE OR REPLACE FUNCTION deduct_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Por cada venta, restar ingredientes del producto vendido
  UPDATE supplies s
  SET current_quantity = current_quantity - (pi.quantity * NEW.quantity)
  FROM product_ingredients pi
  WHERE pi.product_id = NEW.product_id
    AND pi.supply_id = s.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deduct_inventory
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION deduct_inventory_on_sale();
```

## Cambios en Frontend

### 1. Componente de Edición de Insumos
**Archivo:** `components/edit-supply-dialog.tsx`

Agregar campos:
```tsx
// Nuevo estado
const [contentPerUnit, setContentPerUnit] = useState(750);
const [contentUnit, setContentUnit] = useState('ml');

// En el formulario
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>Contenido por Unidad</Label>
    <Input 
      type="number" 
      value={contentPerUnit}
      onChange={(e) => setContentPerUnit(parseFloat(e.target.value))}
    />
  </div>
  <div>
    <Label>Unidad de Contenido</Label>
    <Select value={contentUnit} onValueChange={setContentUnit}>
      <SelectItem value="ml">ml</SelectItem>
      <SelectItem value="L">L</SelectItem>
      <SelectItem value="g">g</SelectItem>
      <SelectItem value="kg">kg</SelectItem>
    </Select>
  </div>
</div>

// Explicación
<p className="text-xs text-muted-foreground">
  Ejemplo: Una botella de 750ml. Contenido: 750ml
</p>
```

### 2. Componente de Creación de Productos
**Archivo:** `app/demo/productos/page.tsx`

Modificar sección de ingredientes:
```tsx
// Cambiar de input simple a selector de insumo exacto
<Select 
  value={ingredient.supply_id}
  onValueChange={(id) => updateIngredient(index, 'supply_id', id)}
>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar insumo" />
  </SelectTrigger>
  <SelectContent>
    {supplies.map(supply => (
      <SelectItem key={supply.id} value={supply.id}>
        {supply.name} ({supply.content_per_unit}{supply.content_unit})
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// Cantidad a usar
<Input
  type="number"
  placeholder="Cantidad (ml)"
  value={ingredient.quantity}
  onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
/>
```

### 3. Página de Ventas - Resta Automática
**Archivo:** `app/demo/ventas/page.tsx`

Al registrar venta:
```tsx
const handleSale = async (productId: string, quantity: number) => {
  const supabase = createClient();
  
  // 1. Registrar venta (el trigger se encarga de restar inventario)
  const { data, error } = await supabase
    .from('sales')
    .insert({
      product_id: productId,
      quantity: quantity,
      establishment_id: establishmentId,
      created_at: new Date().toISOString()
    });
  
  if (error) {
    toast.error('Error al registrar venta');
    return;
  }
  
  // 2. Verificar si algún insumo quedó bajo el mínimo
  const { data: lowSupplies } = await supabase
    .from('supplies')
    .select('name, current_quantity, min_threshold')
    .eq('establishment_id', establishmentId)
    .lt('current_quantity', 'min_threshold');
  
  if (lowSupplies && lowSupplies.length > 0) {
    toast.warning(`⚠️ Insumos bajos: ${lowSupplies.map(s => s.name).join(', ')}`);
  }
  
  toast.success('Venta registrada. Inventario actualizado.');
};
```

## Flujo Completo

### Ejemplo: Vender 1 Mojito

1. **Producto "Mojito" tiene ingredientes:**
   - Ron Bacardi 750ml: 50ml
   - Azúcar: 10g
   - Menta: 5 hojas
   - Limón: 15ml

2. **Inventario actual:**
   - Ron Bacardi 750ml: 1500ml (2 botellas)
   - Azúcar: 500g
   - Menta: 100 hojas
   - Limón: 200ml

3. **Al vender 1 Mojito:**
   ```sql
   -- Trigger ejecuta automáticamente:
   UPDATE supplies SET current_quantity = 1500 - 50 WHERE name = 'Ron Bacardi'; -- = 1450ml
   UPDATE supplies SET current_quantity = 500 - 10 WHERE name = 'Azúcar'; -- = 490g
   UPDATE supplies SET current_quantity = 100 - 5 WHERE name = 'Menta'; -- = 95 hojas
   UPDATE supplies SET current_quantity = 200 - 15 WHERE name = 'Limón'; -- = 185ml
   ```

4. **Resultado:**
   - Ron Bacardi: 1450ml (1.93 botellas)
   - Azúcar: 490g
   - Menta: 95 hojas
   - Limón: 185ml

## Próximos Pasos

1. ✅ Crear migración SQL (005_add_supply_content.sql)
2. ⏳ Ejecutar migración en Supabase
3. ⏳ Actualizar componente de edición de insumos
4. ⏳ Actualizar componente de creación de productos
5. ⏳ Implementar trigger de resta automática
6. ⏳ Actualizar página de ventas
7. ⏳ Agregar alertas de inventario bajo

## Notas Importantes

- **Unidades consistentes:** Asegurar que cantidad en producto use misma unidad que insumo
- **Validación:** No permitir ventas si no hay suficiente inventario
- **Histórico:** Mantener registro de cambios de inventario
- **Rollback:** Permitir cancelar ventas y restaurar inventario
