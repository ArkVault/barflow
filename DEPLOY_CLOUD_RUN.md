# 🚀 GUÍA DE DEPLOYMENT A GOOGLE CLOUD RUN - Barmode

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

# O instalación manual
curl https://sdk.cloud.google.com | bash

# Inicializar y autenticar
gcloud init
gcloud auth login
```

---

## Paso 3: Configurar Proyecto en Google Cloud

```bash
# Establecer proyecto activo (Barmode usa barflow-479001)
gcloud config set project barflow-479001

# Verificar billing (debe usar WithCredits para trial)
gcloud billing projects describe barflow-479001

# Habilitar APIs necesarias
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

---

## Paso 4: Deploy con Cloud Build (Recomendado)

```bash
# Desde el directorio del proyecto
cd /Users/gibrann/Desktop/Barflow

# Deploy usando cloudbuild.yaml configurado
gcloud builds submit --config=cloudbuild.yaml --region=us-central1
```

Este comando:
- Construye la imagen Docker con build args
- Sube la imagen a Artifact Registry
- Despliega a Cloud Run con configuración optimizada

---

## Paso 5: Obtener URL de Cloud Run

```bash
gcloud run services describe barflow --region=us-central1 --format="value(status.url)"
```

URL actual: `https://barflow-686958505968.us-central1.run.app`

---

## Paso 6: Configurar Stripe Webhook (Producción)

1. Ve a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. URL: `https://barflow-686958505968.us-central1.run.app/api/webhooks/stripe`
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
7. Actualiza en cloudbuild.yaml: `_STRIPE_WEBHOOK_SECRET`

---

## 💰 Configuración de Costos (Optimizada)

| Configuración | Valor | Descripción |
|---------------|-------|-------------|
| Min Instances | 0 | Escala a cero sin tráfico |
| Max Instances | 2 | Máximo para mvp |
| Memory | 256Mi | Mínimo para Next.js |
| CPU | 1 | Con throttling habilitado |
| Billing | WithCredits | Usa créditos trial |

**Costo estimado:** $0-5 USD/mes

---

## 🔧 Comandos Útiles

```bash
# Ver logs
gcloud run logs read barflow --region us-central1

# Ver estado del servicio
gcloud run services describe barflow --region us-central1

# Redeploy
gcloud builds submit --config=cloudbuild.yaml --region=us-central1

# Health check
curl https://barflow-686958505968.us-central1.run.app/api/health

# Ver métricas
gcloud run services describe barflow --region us-central1 --format="value(status.traffic)"
```

---

## ⚠️ Troubleshooting

### Error: "Container failed to start"
- Verifica que todas las variables de entorno estén en cloudbuild.yaml
- Revisa logs: `gcloud run logs read barflow --region us-central1`

### Error: "Build failed"
- Ejecuta `pnpm build` localmente primero
- Revisa el Dockerfile y .dockerignore

### Error 403 Forbidden
```bash
gcloud run services add-iam-policy-binding barflow \
  --region us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### Stripe webhook no funciona
- Verifica que la URL termine en `/api/webhooks/stripe`
- Verifica que el `STRIPE_WEBHOOK_SECRET` sea el correcto
- Prueba con: `stripe trigger checkout.session.completed`

---

## 📋 Checklist Final

- [x] Build local funciona (`pnpm build`)
- [x] Cloud Run deployment exitoso
- [x] IAM configurado para acceso público
- [x] Health check responde correctamente
- [ ] Stripe webhook creado y configurado
- [ ] `STRIPE_WEBHOOK_SECRET` actualizado en cloudbuild.yaml
- [ ] Probar login/registro en producción
- [ ] Probar checkout de Stripe

---

## 🔄 Flujo de Desarrollo

Para evitar deploys innecesarios:

1. **Desarrollo local:** `pnpm dev`
2. **Validación:** `pnpm validate`
3. **Commits a develop:** Solo CI (sin deploy)
4. **Deploy manual:** Cuando esté listo
   ```bash
   gcloud builds submit --config=cloudbuild.yaml --region=us-central1
   ```
