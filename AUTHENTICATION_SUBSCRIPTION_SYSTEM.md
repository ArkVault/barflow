# Sistema de Autenticación y Suscripciones - BarFlow

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de autenticación, trial gratuito y suscripciones con Stripe para BarFlow. Los usuarios reciben un mes gratis después de registrarse y luego pueden suscribirse para continuar usando la plataforma.

## ✨ Características Implementadas

### 1. **Sistema de Autenticación**
- ✅ Registro de usuarios con email y contraseña
- ✅ Confirmación de email obligatoria
- ✅ Email de bienvenida personalizado con información del trial
- ✅ Link único de confirmación
- ✅ Página de confirmación con feedback visual

### 2. **Trial Gratuito (30 días)**
- ✅ Automáticamente se asigna al registrarse
- ✅ Contador de días restantes
- ✅ Banner informativo en el dashboard
- ✅ Alertas cuando quedan pocos días
- ✅ Popup automático cuando expira el trial

### 3. **Sistema de Suscripciones con Stripe**
- ✅ Dos planes: Mensual ($299 MXN) y Anual ($2,990 MXN)
- ✅ Integración completa con Stripe Checkout
- ✅ Webhooks para sincronización automática
- ✅ Gestión de estados de suscripción
- ✅ Modal de suscripción con diseño premium

### 4. **Base de Datos**
- ✅ Campos de suscripción en tabla `establishments`
- ✅ Tracking de trial_end_date
- ✅ Estados de suscripción
- ✅ Integración con Stripe (customer_id, subscription_id)

## 🗂️ Archivos Creados

### Configuración de Stripe
```
lib/stripe/
├── config.ts          # Configuración de Stripe y tipos
└── client.ts          # Cliente de Stripe para el frontend
```

### API Routes
```
app/api/stripe/
├── create-checkout-session/
│   └── route.ts       # Crear sesión de checkout
└── webhook/
    └── route.ts       # Manejar eventos de Stripe
```

### Componentes
```
components/
├── subscription-modal.tsx    # Modal de planes de suscripción
├── subscription-guard.tsx    # Guard para detectar trial expirado
└── trial-banner.tsx          # Banner de información del trial
```

### Hooks
```
hooks/
└── use-subscription.ts       # Hook para gestionar estado de suscripción
```

### Páginas de Autenticación
```
app/auth/
├── confirm/
│   └── page.tsx              # Confirmación de email
├── login/
│   └── page.tsx              # Login (actualizado)
└── sign-up/
    └── page.tsx              # Registro (actualizado)
```

### Base de Datos
```
supabase/migrations/
└── add_subscription_fields.sql   # Migración para campos de suscripción
```

### Documentación
```
STRIPE_SETUP.md              # Guía completa de configuración de Stripe
SUPABASE_EMAIL_SETUP.md      # Guía de configuración de emails
```

## 🚀 Configuración Requerida

### 1. Variables de Entorno

Actualiza tu archivo `.env.local` con las siguientes variables:

```bash
# Stripe Keys (obtener de https://dashboard.stripe.com/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (crear productos en Stripe)
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Configurar Supabase

#### A. Ejecutar la Migración de Base de Datos

1. Ve a tu proyecto en Supabase
2. Navega a **SQL Editor**
3. Copia y ejecuta el contenido de `supabase/migrations/add_subscription_fields.sql`

#### B. Configurar Email Templates

Sigue las instrucciones en `SUPABASE_EMAIL_SETUP.md` para:
- Configurar el template de confirmación de email
- Configurar el template de recuperación de contraseña
- Habilitar confirmación de email
- Configurar URLs de redirección

### 3. Configurar Stripe

Sigue las instrucciones detalladas en `STRIPE_SETUP.md` para:
- Crear cuenta en Stripe
- Obtener API keys
- Crear productos y precios
- Configurar webhooks
- Probar el sistema

## 📊 Flujo de Usuario

### Registro y Trial

```
1. Usuario se registra
   ↓
2. Se crea cuenta en Supabase Auth
   ↓
3. Se crea establishment con trial_end_date (30 días)
   ↓
4. Se envía email de confirmación
   ↓
5. Usuario confirma email
   ↓
6. Usuario accede al dashboard
   ↓
7. Ve banner con días restantes de trial
```

### Expiración del Trial

```
1. Trial expira (30 días después)
   ↓
2. SubscriptionGuard detecta expiración
   ↓
3. Se muestra popup de suscripción
   ↓
4. Usuario elige plan
   ↓
5. Redirige a Stripe Checkout
   ↓
6. Usuario completa pago
   ↓
7. Webhook actualiza estado en Supabase
   ↓
8. Usuario puede continuar usando la app
```

## 🧪 Cómo Probar

### 1. Probar Registro y Email

```bash
# 1. Inicia el servidor de desarrollo
pnpm run dev

# 2. Registra una nueva cuenta en http://localhost:3000/auth/login
# 3. Revisa tu email para el link de confirmación
# 4. Haz clic en el link de confirmación
# 5. Verifica que seas redirigido al dashboard
```

### 2. Probar Trial

```bash
# Opción 1: Esperar 30 días (no recomendado 😅)

# Opción 2: Modificar manualmente en Supabase
# 1. Ve a Supabase → Table Editor → establishments
# 2. Encuentra tu registro
# 3. Cambia trial_end_date a una fecha pasada
# 4. Recarga la app
# 5. Deberías ver el popup de suscripción
```

### 3. Probar Stripe Checkout

```bash
# 1. Asegúrate de tener Stripe CLI instalado
brew install stripe/stripe-cli/stripe

# 2. Inicia sesión
stripe login

# 3. Inicia webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 4. En otra terminal, inicia la app
pnpm run dev

# 5. Haz que expire el trial (ver paso anterior)
# 6. Haz clic en "Suscribirse ahora"
# 7. Usa tarjeta de prueba: 4242 4242 4242 4242
# 8. Completa el checkout
# 9. Verifica que el webhook se reciba correctamente
# 10. Verifica que el estado se actualice en Supabase
```

## 🎨 Componentes UI

### TrialBanner

Muestra información del trial en el dashboard:

```tsx
import { TrialBanner } from "@/components/trial-banner";

export default function DashboardPage() {
  return (
    <div>
      <TrialBanner />
      {/* Resto del dashboard */}
    </div>
  );
}
```

### SubscriptionModal

Modal para mostrar planes y procesar suscripción:

```tsx
import { SubscriptionModal } from "@/components/subscription-modal";

const [showModal, setShowModal] = useState(false);

<SubscriptionModal
  open={showModal}
  onOpenChange={setShowModal}
  trialEnded={false}
/>
```

### useSubscription Hook

Hook para obtener estado de suscripción:

```tsx
import { useSubscription } from "@/hooks/use-subscription";

const { subscription, loading } = useSubscription();

// subscription.isActive - Si tiene acceso activo
// subscription.isTrialing - Si está en trial
// subscription.trialEnded - Si el trial expiró
// subscription.daysRemaining - Días restantes de trial
// subscription.planType - Tipo de plan actual
```

## 🔒 Seguridad

### Implementado

- ✅ Validación de webhooks de Stripe
- ✅ Verificación de usuario autenticado
- ✅ Confirmación de email obligatoria
- ✅ Secrets de Stripe en variables de entorno
- ✅ Validación de sesión en API routes

### Recomendaciones Adicionales

- [ ] Implementar rate limiting en endpoints de API
- [ ] Agregar logs de auditoría para cambios de suscripción
- [ ] Implementar 2FA (autenticación de dos factores)
- [ ] Configurar Stripe Radar para prevención de fraude

## 📈 Monitoreo

### Métricas a Vigilar

1. **Conversión de Trial a Pago**
   - % de usuarios que se suscriben después del trial
   
2. **Churn Rate**
   - % de usuarios que cancelan su suscripción
   
3. **MRR (Monthly Recurring Revenue)**
   - Ingresos mensuales recurrentes
   
4. **Pagos Fallidos**
   - Transacciones que fallan y requieren atención

### Dónde Monitorear

- **Stripe Dashboard**: Métricas de pagos y suscripciones
- **Supabase Dashboard**: Usuarios activos y registros
- **Application Logs**: Errores y eventos importantes

## 🐛 Troubleshooting

### El email de confirmación no llega

1. Revisa la carpeta de spam
2. Verifica la configuración de SMTP en Supabase
3. Revisa los logs en Supabase → Logs → Auth
4. Asegúrate de que la URL de redirección esté configurada

### El webhook de Stripe no funciona

1. Verifica que Stripe CLI esté corriendo
2. Revisa que el webhook secret sea correcto
3. Verifica los logs: `stripe logs tail`
4. Asegúrate de que el endpoint esté accesible

### El popup de suscripción no aparece

1. Verifica que el trial haya expirado
2. Revisa la consola del navegador para errores
3. Verifica que SubscriptionGuard esté en el layout
4. Asegúrate de que el hook useSubscription funcione

### Error al crear checkout session

1. Verifica las API keys de Stripe
2. Asegúrate de que los Price IDs sean correctos
3. Revisa que el usuario esté autenticado
4. Verifica los logs del servidor

## 🚢 Deployment a Producción

### Checklist

- [ ] Configurar variables de entorno de producción
- [ ] Cambiar a API keys de producción de Stripe
- [ ] Configurar webhook de producción en Stripe
- [ ] Configurar SMTP personalizado en Supabase
- [ ] Actualizar URLs en templates de email
- [ ] Probar flujo completo en producción
- [ ] Configurar monitoreo y alertas
- [ ] Documentar proceso de soporte al cliente

## 📚 Recursos

- [Documentación de Stripe](https://stripe.com/docs)
- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Stripe Testing](https://stripe.com/docs/testing)

## 🤝 Soporte

Si tienes problemas o preguntas:

1. Revisa esta documentación
2. Consulta `STRIPE_SETUP.md` y `SUPABASE_EMAIL_SETUP.md`
3. Revisa los logs de la aplicación
4. Contacta al equipo de desarrollo

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0
