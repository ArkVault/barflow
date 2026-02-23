# 💰 Nueva Estructura de Precios - BarFlow

## Actualización de Planes (Diciembre 2024)

Se ha actualizado la estructura de precios para reflejar un modelo **por usuario** con opciones para sucursales individuales y cadenas.

---

## 📊 Planes Disponibles

### 1. Bar Sucursal - Plan Mensual
**$899 MXN/mes por usuario**

- ✅ Gestión completa de inventario
- ✅ Análisis de ventas en tiempo real
- ✅ Proyecciones con IA
- ✅ Gestión de menús ilimitados
- ✅ **1 sucursal**
- ✅ Soporte prioritario

**Ideal para**: Bares independientes o sucursales únicas

---

### 2. Bar Sucursal - Plan Anual
**$700 MXN/mes por usuario** (facturado anualmente)

- ✅ Todo lo del plan mensual
- ✅ **Ahorro de $2,388 al año** por usuario
- ✅ Facturación anual ($8,400/año)
- ✅ Consultoría personalizada
- ✅ Reportes avanzados
- ✅ Soporte 24/7 prioritario

**Ideal para**: Bares que buscan ahorro a largo plazo

**Ahorro**: 22% comparado con el plan mensual

---

### 3. Cadena - Plan Multi-sucursal
**$2,999 MXN/mes por usuario**

- ✅ **Hasta 5 sucursales incluidas**
- ✅ Gestión centralizada
- ✅ Dashboard consolidado
- ✅ Análisis comparativo entre sucursales
- ✅ API de integración
- ✅ Gestor de cuenta dedicado
- ✅ Soporte 24/7 premium
- ✅ Capacitación personalizada

**Ideal para**: Cadenas de bares o grupos restauranteros

**Ventaja**: Gestiona hasta 5 sucursales con un solo usuario

---

## 📈 Comparativa de Precios

| Característica | Bar Mensual | Bar Anual | Cadena |
|----------------|-------------|-----------|--------|
| **Precio/mes** | $899 | $700 | $2,999 |
| **Facturación** | Mensual | Anual | Mensual |
| **Por usuario** | ✅ | ✅ | ✅ |
| **Sucursales** | 1 | 1 | Hasta 5 |
| **Ahorro anual** | - | $2,388 | - |
| **Dashboard consolidado** | ❌ | ❌ | ✅ |
| **Gestor dedicado** | ❌ | ❌ | ✅ |
| **API** | ❌ | ❌ | ✅ |

---

## 💡 Ejemplos de Costo

### Ejemplo 1: Bar Independiente
**Escenario**: 1 bar, 2 usuarios (gerente + bartender)

- **Plan Mensual**: $899 × 2 = **$1,798/mes**
- **Plan Anual**: $700 × 2 = **$1,400/mes** ($16,800/año)
- **Ahorro anual**: $4,776

### Ejemplo 2: Cadena Pequeña
**Escenario**: 3 sucursales, 1 usuario administrador

- **Plan Cadena**: **$2,999/mes** (cubre las 3 sucursales)
- **Alternativa (3 planes individuales)**: $899 × 3 = $2,697/mes
- **Diferencia**: +$302/mes pero con gestión centralizada y features premium

### Ejemplo 3: Cadena Grande
**Escenario**: 5 sucursales, 2 usuarios (director + gerente regional)

- **Plan Cadena**: $2,999 × 2 = **$5,998/mes**
- **Alternativa (5 planes individuales)**: $899 × 5 × 2 = $8,990/mes
- **Ahorro**: $2,992/mes ($35,904/año)

---

## 🎯 ¿Qué Plan Elegir?

### Elige **Bar Sucursal Mensual** si:
- Tienes una sola sucursal
- Prefieres flexibilidad mes a mes
- Estás probando el sistema

### Elige **Bar Sucursal Anual** si:
- Tienes una sola sucursal
- Quieres ahorrar 22% al año
- Estás comprometido a largo plazo

### Elige **Cadena** si:
- Tienes 2-5 sucursales
- Necesitas gestión centralizada
- Quieres análisis comparativos entre sucursales
- Requieres API para integraciones
- Necesitas soporte premium

---

## 🔄 Migración desde Precios Anteriores

Si ya eres cliente con los precios anteriores:

### Precios Anteriores (Descontinuados)
- Plan Mensual: $299/mes
- Plan Anual: $2,990/año

### Política de Migración
- Los clientes existentes mantienen sus precios actuales
- Pueden migrar voluntariamente a los nuevos planes
- Al migrar, obtienen las nuevas funcionalidades
- Contactar a soporte para migración

---

## 📝 Notas Importantes

### Facturación
- Todos los precios son **por usuario**
- Precios en **MXN + IVA**
- Facturación automática vía Stripe
- Métodos de pago: Tarjeta, OXXO, SPEI

### Trial Gratuito
- **30 días gratis** para todos los planes
- Acceso completo durante el trial
- Sin tarjeta de crédito requerida para el trial
- Cancela en cualquier momento

### Usuarios Adicionales
- Puedes agregar usuarios en cualquier momento
- Se prorratean los días restantes del mes
- Cada usuario tiene acceso completo
- Sin límite de usuarios

### Sucursales Adicionales (Plan Cadena)
- El plan incluye hasta 5 sucursales
- Para más de 5 sucursales, contactar ventas
- Precios especiales para cadenas grandes
- Gestión empresarial disponible

---

## 🚀 Cómo Actualizar los Precios en Stripe

### 1. Crear Nuevos Productos en Stripe

```bash
# Bar Sucursal Mensual
Nombre: BarFlow - Bar Sucursal (Mensual)
Precio: 899 MXN/mes
Descripción: Plan mensual por usuario para una sucursal

# Bar Sucursal Anual
Nombre: BarFlow - Bar Sucursal (Anual)
Precio: 8,400 MXN/año (700/mes)
Descripción: Plan anual por usuario - Ahorra $2,388 al año

# Cadena
Nombre: BarFlow - Cadena (Multi-sucursal)
Precio: 2,999 MXN/mes
Descripción: Plan mensual por usuario para hasta 5 sucursales
```

### 2. Actualizar Variables de Entorno

```bash
# En .env.local
NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID=price_xxx
```

### 3. Reiniciar Servidor

```bash
# Detener servidor actual (Ctrl+C)
pnpm run dev
```

---

## 📞 Contacto y Soporte

Para preguntas sobre precios o planes empresariales:
- Email: ventas@barflow.com
- Teléfono: +52 (55) XXXX-XXXX
- Chat en vivo: disponible en la app

---

**Última actualización**: Diciembre 2024
**Versión de precios**: 2.0
