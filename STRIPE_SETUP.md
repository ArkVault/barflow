# Configuración de Stripe para BarFlow

Esta guía te ayudará a configurar Stripe para manejar las suscripciones y pagos en BarFlow.

## 1. Crear una Cuenta en Stripe

1. Ve a [https://stripe.com](https://stripe.com)
2. Crea una cuenta o inicia sesión
3. Completa la verificación de tu negocio (requerido para pagos en producción)

## 2. Obtener las API Keys

### Modo de Prueba (Desarrollo)

1. En el Dashboard de Stripe, asegúrate de estar en **modo de prueba** (toggle en la esquina superior derecha)
2. Ve a **Developers** → **API keys**
3. Copia las siguientes keys:
   - **Publishable key**: Comienza con `pk_test_...`
   - **Secret key**: Comienza con `sk_test_...`

### Actualizar .env.local

Agrega las keys a tu archivo `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_tu_key_aqui
STRIPE_SECRET_KEY=sk_test_tu_key_aqui
```

## 3. Crear Productos y Precios

### Plan Bar Sucursal - Mensual

1. Ve a **Products** → **Add product**
2. Configura el producto:
   - **Name**: `BarFlow - Bar Sucursal (Mensual)`
   - **Description**: `Plan mensual por usuario para una sucursal`
   - **Pricing model**: `Standard pricing`
   - **Price**: `899` MXN
   - **Billing period**: `Monthly`
   - **Currency**: `MXN`
3. Haz clic en **Save product**
4. Copia el **Price ID** (comienza con `price_...`)
5. Agrégalo a `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID=price_tu_id_aqui
```

### Plan Bar Sucursal - Anual

1. Crea otro producto:
   - **Name**: `BarFlow - Bar Sucursal (Anual)`
   - **Description**: `Plan anual por usuario para una sucursal - Ahorra $2,388 al año`
   - **Price**: `8400` MXN (equivalente a $700/mes)
   - **Billing period**: `Yearly`
   - **Currency**: `MXN`
2. Copia el **Price ID**
3. Agrégalo a `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID=price_tu_id_anual_aqui
```

### Plan Cadena - Multi-sucursal

1. Crea el producto para cadenas:
   - **Name**: `BarFlow - Cadena (Multi-sucursal)`
   - **Description**: `Plan mensual por usuario para hasta 5 sucursales`
   - **Price**: `2999` MXN
   - **Billing period**: `Monthly`
   - **Currency**: `MXN`
2. Copia el **Price ID**
3. Agrégalo a `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID=price_tu_id_cadena_aqui
```

### Resumen de Precios

| Plan | Precio | Facturación | Por Usuario | Sucursales |
|------|--------|-------------|-------------|------------|
| Bar Sucursal (Mensual) | $899 MXN | Mensual | ✅ | 1 |
| Bar Sucursal (Anual) | $700 MXN/mes | Anual ($8,400/año) | ✅ | 1 |
| Cadena | $2,999 MXN | Mensual | ✅ | Hasta 5 |

## 4. Configurar Webhooks

Los webhooks permiten que Stripe notifique a tu aplicación sobre eventos importantes (pagos exitosos, suscripciones canceladas, etc.).

### Desarrollo Local con Stripe CLI

1. Instala Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # O descarga desde: https://stripe.com/docs/stripe-cli
   ```

2. Inicia sesión en Stripe CLI:
   ```bash
   stripe login
   ```

3. Inicia el webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copia el **webhook signing secret** que aparece (comienza con `whsec_...`)
5. Agrégalo a `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_tu_secret_aqui
   ```

### Producción

1. Ve a **Developers** → **Webhooks** en Stripe Dashboard
2. Haz clic en **Add endpoint**
3. Configura:
   - **Endpoint URL**: `https://tudominio.com/api/stripe/webhook`
   - **Events to send**: Selecciona:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
4. Copia el **Signing secret**
5. Actualiza tu `.env.local` de producción

## 5. Configurar el Checkout

### Personalizar la Experiencia de Pago

1. Ve a **Settings** → **Branding**
2. Configura:
   - **Brand color**: `#667eea` (color principal de BarFlow)
   - **Logo**: Sube el logo de BarFlow
   - **Icon**: Sube el icono

### Configurar Métodos de Pago

1. Ve a **Settings** → **Payment methods**
2. Habilita los métodos que desees aceptar:
   - ✅ **Cards** (Visa, Mastercard, American Express)
   - ✅ **OXXO** (popular en México)
   - ✅ **SPEI** (transferencias bancarias en México)

## 6. Configurar Emails de Stripe

1. Ve a **Settings** → **Emails**
2. Personaliza los templates de email:
   - **Payment confirmation**
   - **Subscription confirmation**
   - **Failed payment**
   - **Subscription canceled**

## 7. Probar el Sistema

### Tarjetas de Prueba

Usa estas tarjetas de prueba en modo desarrollo:

| Escenario | Número de Tarjeta | CVC | Fecha |
|-----------|-------------------|-----|-------|
| Pago exitoso | `4242 4242 4242 4242` | Cualquiera | Futura |
| Pago rechazado | `4000 0000 0000 0002` | Cualquiera | Futura |
| Requiere autenticación | `4000 0025 0000 3155` | Cualquiera | Futura |

### Flujo de Prueba

1. Registra una nueva cuenta en BarFlow
2. Espera a que expire el trial (o modifica la fecha en la BD)
3. Verifica que aparezca el popup de suscripción
4. Haz clic en "Suscribirse ahora"
5. Completa el checkout con una tarjeta de prueba
6. Verifica que:
   - Se cree el customer en Stripe
   - Se cree la suscripción
   - Se actualice el estado en Supabase
   - El usuario pueda acceder a la aplicación

## 8. Monitorear Pagos y Suscripciones

### Dashboard de Stripe

- **Payments**: Ver todos los pagos
- **Subscriptions**: Gestionar suscripciones activas
- **Customers**: Ver información de clientes
- **Logs**: Revisar webhooks y eventos

### Métricas Importantes

1. **MRR (Monthly Recurring Revenue)**: Ingresos mensuales recurrentes
2. **Churn Rate**: Tasa de cancelación
3. **Failed Payments**: Pagos fallidos que requieren atención

## 9. Ir a Producción

### Checklist

- [ ] Completar la verificación de negocio en Stripe
- [ ] Cambiar a modo **Live** en Stripe Dashboard
- [ ] Obtener las API keys de producción (pk_live_... y sk_live_...)
- [ ] Actualizar las variables de entorno en producción
- [ ] Configurar webhook en producción
- [ ] Probar el flujo completo en producción
- [ ] Configurar alertas de pagos fallidos
- [ ] Revisar la configuración de impuestos (IVA)

### Variables de Entorno en Producción

```bash
# Stripe Production Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Production Price IDs
NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID=price_live_...
NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID=price_live_...
NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID=price_live_...

# App URL
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

## 10. Gestión de Suscripciones

### Cancelar una Suscripción

Los usuarios pueden cancelar desde:
1. Stripe Customer Portal (recomendado)
2. Tu interfaz personalizada
3. Manualmente desde Stripe Dashboard

### Reactivar una Suscripción

1. El usuario puede suscribirse nuevamente desde la app
2. O puedes reactivar manualmente desde Stripe Dashboard

### Cambiar de Plan

Implementa la funcionalidad para que los usuarios puedan:
- Cambiar de mensual a anual (y viceversa)
- El cambio se prorratea automáticamente

## 11. Seguridad

### Mejores Prácticas

1. ✅ **Nunca** expongas tu Secret Key en el frontend
2. ✅ Valida siempre los webhooks con el signing secret
3. ✅ Usa HTTPS en producción
4. ✅ Implementa rate limiting en tus endpoints
5. ✅ Registra todos los eventos importantes
6. ✅ Monitorea intentos de fraude en Stripe Radar

## 12. Soporte y Recursos

### Documentación Oficial

- [Stripe Docs](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

### Soporte

- **Stripe Support**: Disponible 24/7 en el Dashboard
- **Community**: [Stripe Discord](https://discord.gg/stripe)
- **Status**: [status.stripe.com](https://status.stripe.com)

## 13. Costos de Stripe

### Comisiones en México

- **Tarjetas mexicanas**: 3.6% + $3 MXN por transacción
- **Tarjetas internacionales**: 3.6% + $3 MXN + 1.5%
- **OXXO**: 3.6% + $3 MXN
- **SPEI**: $8 MXN por transacción

### Sin Costos Ocultos

- ✅ Sin cuota mensual
- ✅ Sin costos de configuración
- ✅ Sin contratos a largo plazo
- ✅ Solo pagas por transacciones exitosas

---

## Comandos Útiles

```bash
# Iniciar webhook forwarding en desarrollo
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Probar un webhook manualmente
stripe trigger checkout.session.completed

# Ver logs de webhooks
stripe logs tail

# Listar productos
stripe products list

# Listar precios
stripe prices list

# Ver detalles de un customer
stripe customers retrieve cus_xxx
```

---

¡Listo! Con esta configuración, tu sistema de suscripciones con Stripe estará completamente funcional. 🎉
