# 🎯 Guía Paso a Paso - Configuración de Stripe

## 📋 Requisitos Previos
- Cuenta en Stripe (si no tienes, créala en https://stripe.com)
- Acceso al Dashboard de Stripe
- 20 minutos de tiempo

---

## 🚀 Paso 1: Acceder a Stripe Dashboard

1. Ve a https://dashboard.stripe.com
2. Inicia sesión con tu cuenta
3. **IMPORTANTE**: Asegúrate de estar en **modo de prueba** (Test mode)
   - Verifica el toggle en la esquina superior derecha
   - Debe decir "Test mode" activado
   - Esto te permite probar sin cargos reales

---

## 💳 Paso 2: Crear Producto 1 - Bar Sucursal (Mensual)

### 2.1 Navegar a Productos
1. En el menú lateral izquierdo, haz clic en **"Product catalog"** o **"Productos"**
2. Haz clic en el botón **"+ Add product"** o **"+ Agregar producto"**

### 2.2 Configurar el Producto
Llena el formulario con estos datos exactos:

**Información del Producto:**
- **Name** (Nombre): `BarFlow - Bar Sucursal (Mensual)`
- **Description** (Descripción): `Plan mensual por usuario para una sucursal`
- **Image** (opcional): Puedes subir un logo si tienes

**Pricing Information:**
- **Pricing model**: Selecciona `Standard pricing`
- **Price**: `899`
- **Currency**: Selecciona `MXN` (Peso mexicano)
- **Billing period**: Selecciona `Monthly` (Mensual)

### 2.3 Configuración Adicional (Opcional)
- **Statement descriptor**: `BARFLOW MENSUAL` (aparecerá en el estado de cuenta)
- **Unit label**: `usuario` (opcional)

### 2.4 Guardar
1. Haz clic en **"Save product"** o **"Guardar producto"**
2. **¡MUY IMPORTANTE!** Copia el **Price ID**
   - Aparece debajo del precio
   - Comienza con `price_`
   - Ejemplo: `price_1AbCdEfGhIjKlMnO`
   - **Guárdalo en un lugar seguro** (notepad, notas, etc.)

---

## 💰 Paso 3: Crear Producto 2 - Bar Sucursal (Anual)

### 3.1 Crear Nuevo Producto
1. Regresa a **"Product catalog"**
2. Haz clic en **"+ Add product"**

### 3.2 Configurar el Producto
**Información del Producto:**
- **Name**: `BarFlow - Bar Sucursal (Anual)`
- **Description**: `Plan anual por usuario para una sucursal - Ahorra $2,388 al año`

**Pricing Information:**
- **Pricing model**: `Standard pricing`
- **Price**: `8400` (esto es 700 × 12 meses)
- **Currency**: `MXN`
- **Billing period**: Selecciona `Yearly` (Anual)

### 3.3 Guardar y Copiar Price ID
1. Haz clic en **"Save product"**
2. **Copia el Price ID** (comienza con `price_`)
3. Guárdalo junto con el anterior

---

## 🏢 Paso 4: Crear Producto 3 - Cadena (Multi-sucursal)

### 4.1 Crear Nuevo Producto
1. Regresa a **"Product catalog"**
2. Haz clic en **"+ Add product"**

### 4.2 Configurar el Producto
**Información del Producto:**
- **Name**: `BarFlow - Cadena (Multi-sucursal)`
- **Description**: `Plan mensual por usuario para hasta 5 sucursales`

**Pricing Information:**
- **Pricing model**: `Standard pricing`
- **Price**: `2999`
- **Currency**: `MXN`
- **Billing period**: `Monthly`

### 4.3 Guardar y Copiar Price ID
1. Haz clic en **"Save product"**
2. **Copia el Price ID**
3. Ahora deberías tener **3 Price IDs** guardados

---

## 🔑 Paso 5: Obtener API Keys

### 5.1 Navegar a API Keys
1. En el menú lateral, haz clic en **"Developers"**
2. Selecciona **"API keys"**

### 5.2 Copiar las Keys
Verás dos keys importantes:

**Publishable key** (Clave pública):
- Comienza con `pk_test_`
- Haz clic en "Reveal test key" si está oculta
- Copia toda la key
- Ejemplo: `pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz...`

**Secret key** (Clave secreta):
- Comienza con `sk_test_`
- Haz clic en "Reveal test key"
- Copia toda la key
- Ejemplo: `sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz...`

⚠️ **IMPORTANTE**: Nunca compartas tu Secret Key públicamente

---

## 🔔 Paso 6: Configurar Webhook (Para desarrollo local)

### 6.1 Instalar Stripe CLI (si no lo tienes)
Abre una terminal y ejecuta:

```bash
# En macOS
brew install stripe/stripe-cli/stripe
```

### 6.2 Iniciar Sesión en Stripe CLI
```bash
stripe login
```
- Se abrirá tu navegador
- Autoriza el acceso
- Regresa a la terminal

### 6.3 Iniciar Webhook Forwarding
En una **nueva terminal** (déjala corriendo), ejecuta:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 6.4 Copiar Webhook Secret
- Verás un mensaje como: `Your webhook signing secret is whsec_...`
- **Copia ese secret** (comienza con `whsec_`)
- Guárdalo con las demás keys

---

## 📝 Paso 7: Actualizar Variables de Entorno

### 7.1 Abrir .env.local
En tu editor de código, abre el archivo `.env.local`

### 7.2 Actualizar las Variables
Reemplaza los valores de ejemplo con tus keys reales:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_TU_KEY_AQUI
STRIPE_SECRET_KEY=sk_test_TU_KEY_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_SECRET_AQUI

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID=price_TU_ID_MENSUAL
NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID=price_TU_ID_ANUAL
NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID=price_TU_ID_CADENA
```

### 7.3 Guardar el Archivo
- Guarda `.env.local`
- **NO** hagas commit de este archivo (ya está en .gitignore)

---

## 🔄 Paso 8: Reiniciar el Servidor

### 8.1 Detener el Servidor Actual
En la terminal donde corre `pnpm run dev`:
- Presiona `Ctrl + C`

### 8.2 Iniciar el Servidor
```bash
pnpm run dev
```

---

## ✅ Paso 9: Verificar que Funciona

### 9.1 Abrir la Aplicación
1. Ve a http://localhost:3000
2. Inicia sesión o registra una cuenta de prueba

### 9.2 Probar el Modal de Suscripción
1. Si tienes trial activo, modifica la fecha en Supabase para que expire
2. O navega a una página que muestre el modal
3. Deberías ver **3 planes**:
   - Bar Sucursal (Mensual) - $899/mes
   - Bar Sucursal (Anual) - $700/mes
   - Cadena - $2,999/mes

### 9.3 Probar un Checkout (Opcional)
1. Haz clic en "Suscribirse ahora" en cualquier plan
2. Deberías ser redirigido a Stripe Checkout
3. Usa la tarjeta de prueba: `4242 4242 4242 4242`
   - CVC: cualquier 3 dígitos
   - Fecha: cualquier fecha futura
   - Código postal: cualquiera
4. Completa el pago
5. Verifica que:
   - Regreses a la app
   - El webhook se reciba (verás en la terminal de Stripe CLI)
   - El estado se actualice en Supabase

---

## 📊 Resumen de lo que Creaste

Al final deberías tener:

### En Stripe Dashboard:
✅ 3 productos creados
✅ 3 Price IDs copiados
✅ API keys copiadas
✅ Webhook configurado (CLI corriendo)

### En tu Código:
✅ `.env.local` actualizado con todas las keys
✅ Servidor reiniciado
✅ Modal mostrando 3 planes

---

## 🐛 Problemas Comunes

### "No veo los productos en Stripe"
- Asegúrate de estar en modo Test
- Refresca la página del dashboard

### "El modal no muestra los planes"
- Verifica que las variables en `.env.local` estén correctas
- Asegúrate de haber reiniciado el servidor
- Revisa la consola del navegador para errores

### "Error al crear checkout"
- Verifica que los Price IDs sean correctos
- Asegúrate de que Stripe CLI esté corriendo
- Revisa que las API keys sean de modo test

### "El webhook no funciona"
- Asegúrate de que Stripe CLI esté corriendo
- Verifica que el webhook secret sea correcto
- Reinicia Stripe CLI si es necesario

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa los logs de la consola del navegador
2. Revisa los logs del servidor (terminal)
3. Revisa los logs de Stripe CLI
4. Verifica que todas las keys estén correctas

---

## 🎉 ¡Listo!

Si completaste todos los pasos, tu sistema de suscripciones está funcionando.

**Próximos pasos:**
- Probar el flujo completo de suscripción
- Personalizar los emails de Stripe
- Configurar el Customer Portal de Stripe
- Preparar para producción cuando estés listo

---

**Tiempo estimado total**: 20-30 minutos
**Dificultad**: Media
**Requisitos**: Cuenta de Stripe, Stripe CLI instalado
