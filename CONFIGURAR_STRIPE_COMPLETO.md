# 🔧 CONFIGURACIÓN COMPLETA DE STRIPE - PASO B

## 📋 Requisitos Previos

- ✅ Cuenta de Stripe creada
- ✅ Archivos API creados:
  - `app/api/create-checkout-session/route.ts`
  - `app/api/webhooks/stripe/route.ts`

---

## PARTE 1: CONFIGURAR PRODUCTOS EN STRIPE

### Paso 1: Crear los 3 Productos

Ve a: https://dashboard.stripe.com/products

#### Producto 1: Bar Sucursal (Mensual)
```
Nombre: Bar Sucursal - Plan Mensual
Descripción: Plan mensual para un solo bar
Precio: $899 MXN / mes
Tipo: Recurrente
Intervalo: Mensual
```

**Después de crear, copia el Price ID** (empieza con `price_...`)

#### Producto 2: Bar Sucursal (Anual)
```
Nombre: Bar Sucursal - Plan Anual
Descripción: Plan anual para un solo bar ($700/mes facturado anualmente)
Precio: $8,400 MXN / año
Tipo: Recurrente
Intervalo: Anual
```

**Copia el Price ID**

#### Producto 3: Cadena (Multisucursal)
```
Nombre: Cadena - Plan Multisucursal
Descripción: Plan para hasta 5 sucursales
Precio: $2,999 MXN / mes
Tipo: Recurrente
Intervalo: Mensual
```

**Copia el Price ID**

---

## PARTE 2: CONFIGURAR VARIABLES DE ENTORNO

### Paso 2: Obtener las API Keys

Ve a: https://dashboard.stripe.com/apikeys

Copia:
- **Publishable key** (empieza con `pk_test_...`)
- **Secret key** (empieza con `sk_test_...`)

### Paso 3: Actualizar `.env.local`

Reemplaza en tu archivo `.env.local`:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_TU_KEY_AQUI
STRIPE_SECRET_KEY=sk_test_TU_SECRET_KEY_AQUI

# Stripe Price IDs (los que copiaste en Paso 1)
NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID=price_XXXXXXXXXXXXX
NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID=price_XXXXXXXXXXXXX
NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID=price_XXXXXXXXXXXXX
```

### Paso 4: Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C en la terminal)
# Luego reiniciar:
pnpm run dev
```

---

## PARTE 3: CONFIGURAR WEBHOOKS

### Paso 5: Instalar Stripe CLI (Para Testing Local)

**En macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Verificar instalación:**
```bash
stripe --version
```

### Paso 6: Login en Stripe CLI

```bash
stripe login
```

Esto abrirá tu navegador para autorizar.

### Paso 7: Configurar Webhook Local

En una **nueva terminal**, ejecuta:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Copia el webhook secret** que aparece (empieza con `whsec_...`)

### Paso 8: Agregar Webhook Secret a `.env.local`

```bash
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_AQUI
```

### Paso 9: Reiniciar el Servidor (otra vez)

```bash
# Detener y reiniciar pnpm run dev
```

---

## PARTE 4: PROBAR EL FLUJO DE UPGRADE

### Paso 10: Probar el Botón de Upgrade

1. **Inicia sesión** en tu app: http://localhost:3000/auth/login

2. **Ve al Dashboard**: Deberías ver el botón "Upgrade a Cadena" en el sidebar

3. **Haz clic en "Upgrade a Cadena"**:
   - Debería abrir el modal con la comparación de planes
   - Verifica que los precios sean correctos

4. **Haz clic en "Upgrade Ahora"**:
   - Debería redirigir a Stripe Checkout
   - Usa tarjeta de prueba: `4242 4242 4242 4242`
   - Fecha: Cualquier fecha futura
   - CVC: Cualquier 3 dígitos
   - Código postal: Cualquier código

5. **Completa el pago**:
   - Deberías volver a `/dashboard?session_id=...`
   - En la terminal de Stripe CLI deberías ver eventos

6. **Verifica en Supabase**:
   ```sql
   SELECT 
     name,
     subscription_status,
     plan_type,
     stripe_subscription_id
   FROM establishments
   WHERE user_id = auth.uid();
   ```
   
   Debería mostrar:
   - `subscription_status`: "active"
   - `plan_type`: "chain"
   - `stripe_subscription_id`: "sub_..."

---

## PARTE 5: WEBHOOKS EN PRODUCCIÓN

### Cuando despliegues a producción:

1. **Ve a**: https://dashboard.stripe.com/webhooks

2. **Crea un nuevo endpoint**:
   ```
   URL: https://tu-dominio.com/api/webhooks/stripe
   ```

3. **Selecciona estos eventos**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. **Copia el Signing Secret** (empieza con `whsec_...`)

5. **Actualiza `.env.local` en producción** con el nuevo webhook secret

---

## 🧪 TESTING CHECKLIST

- [ ] Productos creados en Stripe
- [ ] Price IDs copiados a `.env.local`
- [ ] API Keys configuradas
- [ ] Servidor reiniciado
- [ ] Stripe CLI instalado y logueado
- [ ] Webhook local funcionando
- [ ] Botón de upgrade visible en sidebar
- [ ] Modal se abre correctamente
- [ ] Checkout de Stripe funciona
- [ ] Pago de prueba exitoso
- [ ] Webhooks recibidos en terminal
- [ ] Base de datos actualizada correctamente

---

## 🆘 TROUBLESHOOTING

### Error: "Missing Stripe environment variables"
- Verifica que `.env.local` tenga todas las keys
- Reinicia el servidor

### Error: "Webhook signature verification failed"
- Verifica que `STRIPE_WEBHOOK_SECRET` sea correcto
- Asegúrate de que Stripe CLI esté corriendo

### Error: "No such price"
- Verifica que los Price IDs sean correctos
- Asegúrate de usar los IDs de **test mode**

### Checkout no redirige
- Verifica que `NEXT_PUBLIC_APP_URL` sea `http://localhost:3000`
- Revisa la consola del navegador

---

## 📊 EVENTOS DE WEBHOOK QUE MANEJAMOS

| Evento | Acción |
|--------|--------|
| `checkout.session.completed` | Activa la suscripción |
| `customer.subscription.updated` | Actualiza estado de suscripción |
| `customer.subscription.deleted` | Cancela la suscripción |
| `invoice.payment_succeeded` | Marca como activo |
| `invoice.payment_failed` | Marca como vencido |

---

## ✅ SIGUIENTE PASO

Una vez que todo funcione:
1. Probar cancelación de suscripción
2. Probar actualización de plan
3. Implementar restricción de sucursales según plan

**¿Todo listo?** Sigue los pasos en orden y dime en cuál te quedas si hay algún problema. 🚀
