# 🚀 Inicio Rápido - Sistema de Autenticación y Suscripciones

## ⚡ Configuración en 3 Pasos

### Paso 1: Configurar Base de Datos (5 min)

1. Ve a [Supabase](https://app.supabase.com) → Tu proyecto
2. Click en **SQL Editor**
3. Copia y pega el contenido de `supabase/migrations/add_subscription_fields.sql`
4. Click en **Run**

### Paso 2: Configurar Stripe (20 min)

```bash
# 1. Crear cuenta en Stripe (si no tienes)
# Ir a: https://stripe.com

# 2. Obtener API Keys
# Dashboard → Developers → API keys
# Copiar: Publishable key y Secret key

# 3. Crear Productos
# Dashboard → Products → Add product

# Plan Mensual:
# - Nombre: BarFlow - Plan Mensual
# - Precio: 299 MXN
# - Recurrencia: Mensual
# → Copiar Price ID

# Plan Anual:
# - Nombre: BarFlow - Plan Anual  
# - Precio: 2990 MXN
# - Recurrencia: Anual
# → Copiar Price ID

# 4. Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# 5. Iniciar sesión
stripe login

# 6. Iniciar webhook forwarding (en una terminal separada)
stripe listen --forward-to localhost:3000/api/stripe/webhook
# → Copiar webhook secret (whsec_...)
```

### Paso 3: Actualizar Variables de Entorno (2 min)

Edita `.env.local` y reemplaza los valores:

```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_TU_KEY_AQUI
STRIPE_SECRET_KEY=sk_test_TU_KEY_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_SECRET_AQUI

# Price IDs
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_TU_ID_MENSUAL
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_TU_ID_ANUAL
```

## ✅ Verificar que Funciona

```bash
# 1. Reiniciar el servidor
# Ctrl+C en la terminal donde corre pnpm run dev
pnpm run dev

# 2. Registrar nueva cuenta
# Ir a: http://localhost:3000/auth/login
# Click en "¿No tienes cuenta? Regístrate"
# Llenar formulario

# 3. Confirmar email
# Revisar tu email
# Click en "Confirmar mi cuenta"

# 4. Ver dashboard
# Deberías ver el banner de trial con 30 días restantes

# 5. Probar checkout (opcional)
# En Supabase, cambiar trial_end_date a una fecha pasada
# Recargar la app
# Debería aparecer el popup de suscripción
# Usar tarjeta de prueba: 4242 4242 4242 4242
```

## 📧 Configurar Emails Bonitos (Opcional - 10 min)

1. Ve a Supabase → Authentication → Email Templates
2. Sigue las instrucciones en `SUPABASE_EMAIL_SETUP.md`
3. Copia los templates HTML proporcionados

## 🎯 Componentes Listos para Usar

### Mostrar Banner de Trial en Dashboard

```tsx
import { TrialBanner } from "@/components/trial-banner";

export default function DashboardPage() {
  return (
    <div>
      <TrialBanner />
      {/* Tu contenido del dashboard */}
    </div>
  );
}
```

### Verificar Estado de Suscripción

```tsx
import { useSubscription } from "@/hooks/use-subscription";

export default function MyComponent() {
  const { subscription, loading } = useSubscription();
  
  if (loading) return <div>Cargando...</div>;
  
  if (!subscription.isActive) {
    return <div>Suscripción requerida</div>;
  }
  
  return <div>Contenido para usuarios activos</div>;
}
```

### Mostrar Modal de Suscripción Manualmente

```tsx
import { SubscriptionModal } from "@/components/subscription-modal";
import { useState } from "react";

export default function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Ver Planes
      </button>
      
      <SubscriptionModal
        open={showModal}
        onOpenChange={setShowModal}
      />
    </>
  );
}
```

## 🐛 Problemas Comunes

### "Email no llega"
- Revisa spam
- Verifica configuración en Supabase → Authentication → Email Templates
- En desarrollo, los emails pueden tardar 1-2 minutos

### "Webhook no funciona"
- Asegúrate de que Stripe CLI esté corriendo: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Verifica que el webhook secret esté en `.env.local`
- Reinicia el servidor después de cambiar variables de entorno

### "Popup no aparece cuando expira trial"
- Verifica que `trial_end_date` sea una fecha pasada en Supabase
- Recarga la página completamente (Cmd+Shift+R)
- Revisa la consola del navegador para errores

### "Error al crear checkout"
- Verifica que las API keys de Stripe sean correctas
- Asegúrate de que los Price IDs existan en Stripe
- Revisa que el usuario esté autenticado

## 📚 Documentación Completa

- **Guía completa**: `AUTHENTICATION_SUBSCRIPTION_SYSTEM.md`
- **Setup de Stripe**: `STRIPE_SETUP.md`
- **Setup de Emails**: `SUPABASE_EMAIL_SETUP.md`
- **Resumen ejecutivo**: `RESUMEN_IMPLEMENTACION.md`

## 🎉 ¡Listo!

Tu sistema de autenticación y suscripciones está completamente implementado. Los usuarios ahora:

1. ✅ Reciben email de bienvenida al registrarse
2. ✅ Tienen 30 días de trial gratis
3. ✅ Ven un banner con días restantes
4. ✅ Reciben popup cuando expira el trial
5. ✅ Pueden suscribirse con Stripe
6. ✅ Todo se sincroniza automáticamente

---

**¿Necesitas ayuda?** Revisa la documentación completa en los archivos MD mencionados arriba.
