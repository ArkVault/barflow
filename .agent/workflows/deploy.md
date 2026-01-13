---
description: How to deploy changes to production
---

# Workflow de Deploy a Producción

Este workflow describe cómo manejar cambios y deploys de manera eficiente.

## 🔄 Flujo de Desarrollo Diario

### 1. Desarrollo Local
```bash
# Trabajar en rama feature
git checkout -b feature/mi-cambio

# Hacer cambios y probar localmente
pnpm dev

# Verificar que compila
pnpm build
```

### 2. Subir Cambios (sin deploy)
```bash
# Commit y push
git add .
git commit -m "feat: descripción del cambio"
git push origin feature/mi-cambio

# Crear PR a develop (NO a main)
# GitHub Actions validará el código automáticamente
```

### 3. Acumular Cambios en Develop
```bash
# Mergear PRs aprobados a develop
# Esto NO dispara deploy
```

## 🚀 Cuándo Hacer Deploy

### Opción A: Deploy Manual (Recomendado)
1. Ve a GitHub → Actions → "Deploy to Cloud Run"
2. Click "Run workflow"
3. Selecciona "production"
4. Click "Run workflow"

### Opción B: Crear Release
```bash
# Cuando develop está listo para producción
git checkout main
git merge develop
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin main --tags
# Esto dispara deploy automático
```

### Opción C: Deploy Local Directo (Emergencias)
```bash
# Solo para hotfixes críticos
# turbo
~/google-cloud-sdk/bin/gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions-file=cloudbuild.substitutions.local.yaml \
  --region=us-central1
```

## ⏰ Frecuencia de Deploy Recomendada

| Situación | Frecuencia |
|-----------|------------|
| Desarrollo normal | 1-2 veces por semana |
| Pre-lanzamiento | Diario |
| Hotfix crítico | Inmediato |

## 📋 Checklist Pre-Deploy

- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm build` compila correctamente
- [ ] Probado en localhost
- [ ] PRs aprobados y mergeados a develop
- [ ] No hay cambios WIP pendientes

## 💰 Impacto en Costos

| Acción | Costo Aproximado |
|--------|------------------|
| Build en Cloud Build | ~$0.003 por build |
| Storage de imagen | ~$0.02/GB/mes |
| Cloud Run (min=0) | $0 cuando no hay tráfico |

**Tip:** Con min-instances=0, solo pagas cuando hay usuarios activos.
