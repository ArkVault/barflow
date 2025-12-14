# 🚀 GUÍA DE DEPLOYMENT A GOOGLE CLOUD RUN

## Paso 1: Verificar Build Local (5 min)

```bash
cd /Users/gibrann/Desktop/Barflow
pnpm build
```

Si hay errores, corrígelos antes de continuar.

---

## Paso 2: Instalar Google Cloud CLI (si no lo tienes)

```bash
# macOS con Homebrew
brew install google-cloud-sdk

# Inicializar y autenticar
gcloud init
gcloud auth login
```

---

## Paso 3: Crear Proyecto en Google Cloud (5 min)

```bash
# Crear proyecto (si no existe)
gcloud projects create barflow-mvp --name="Barflow MVP"

# Establecer proyecto activo
gcloud config set project barflow-mvp

# Habilitar APIs necesarias
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

---

## Paso 4: Deploy a Cloud Run (10 min)

### Opción A: Deploy directo desde código (recomendado para MVP)

```bash
# Desde el directorio del proyecto
cd /Users/gibrann/Desktop/Barflow

# Deploy con configuración optimizada para costos bajos
gcloud run deploy barflow \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 2 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL" \
  --set-env-vars "NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY" \
  --set-env-vars "GEMINI_API_KEY=YOUR_GEMINI_API_KEY" \
  --set-env-vars "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY" \
  --set-env-vars "STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY" \
  --set-env-vars "NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID=YOUR_PRICE_ID" \
  --set-env-vars "NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID=YOUR_PRICE_ID" \
  --set-env-vars "NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID=YOUR_PRICE_ID"
```

> ⚠️ **NOTA**: Reemplaza los valores `YOUR_*` con tus keys reales de `.env.production`. 
> `STRIPE_WEBHOOK_SECRET` y `NEXT_PUBLIC_APP_URL` se configuran después del deploy inicial.

---

## Paso 5: Obtener URL de Cloud Run

Después del deploy, verás algo como:
```
Service URL: https://barflow-xxxxx-uc.a.run.app
```

Guarda esta URL, la necesitarás para los siguientes pasos.

---

## Paso 6: Configurar Stripe Webhook (5 min)

1. Ve a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. URL: `https://TU_CLOUDRUN_URL/api/webhooks/stripe`
4. Selecciona estos eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
   - `customer.subscription.resumed`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.payment_action_required`
   - `charge.dispute.created`
   - `charge.dispute.closed`
   - `charge.refunded`
5. Click **"Add endpoint"**
6. Copia el **Signing secret** (empieza con `whsec_`)

---

## Paso 7: Actualizar Variables Faltantes

```bash
# Actualizar con las variables faltantes
gcloud run services update barflow \
  --region us-central1 \
  --set-env-vars "STRIPE_WEBHOOK_SECRET=whsec_TU_NUEVO_SECRET" \
  --set-env-vars "NEXT_PUBLIC_APP_URL=https://TU_CLOUDRUN_URL"
```

---

## Paso 8: Verificar Deployment

1. Abre tu URL de Cloud Run en el navegador
2. Verifica que puedes:
   - [ ] Ver la landing page
   - [ ] Hacer login/registro
   - [ ] Acceder al dashboard
   - [ ] Ver el inventario

---

## 💰 Costos Estimados (MVP)

| Recurso | Free Tier | Tu uso estimado | Costo |
|---------|-----------|-----------------|-------|
| Cloud Run | 2M requests/mes | ~10K requests | $0 |
| Cloud Build | 120 min/día | ~10 min/deploy | $0 |
| Artifact Registry | 0.5GB | ~200MB | $0 |
| **Total mensual** | - | - | **$0-5** |

---

## 🔧 Comandos Útiles

```bash
# Ver logs
gcloud run logs read barflow --region us-central1

# Ver estado del servicio
gcloud run services describe barflow --region us-central1

# Redeploy después de cambios
gcloud run deploy barflow --source . --region us-central1

# Ver métricas
gcloud run services describe barflow --region us-central1 --format="value(status.traffic)"
```

---

## ⚠️ Troubleshooting

### Error: "Container failed to start"
- Verifica que todas las variables de entorno estén configuradas
- Revisa logs: `gcloud run logs read barflow --region us-central1`

### Error: "Build failed"
- Ejecuta `pnpm build` localmente primero
- Revisa el Dockerfile y .dockerignore

### Stripe webhook no funciona
- Verifica que la URL termine en `/api/webhooks/stripe`
- Verifica que el `STRIPE_WEBHOOK_SECRET` sea el correcto
- Prueba con: `stripe trigger checkout.session.completed`

---

## 📋 Checklist Final

- [ ] Build local funciona (`pnpm build`)
- [ ] Cloud Run deployment exitoso
- [ ] Stripe webhook creado y configurado
- [ ] `NEXT_PUBLIC_APP_URL` actualizado
- [ ] `STRIPE_WEBHOOK_SECRET` actualizado
- [ ] Login/Registro funciona
- [ ] Dashboard carga correctamente
