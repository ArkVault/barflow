# Stttock — Sistema de Gestión para Bares y Restaurantes

[![Deployed on Cloud Run](https://img.shields.io/badge/Deployed%20on-Cloud%20Run-4285F4?style=for-the-badge&logo=google-cloud)](https://flowstock-686958505968.us-central1.run.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Live-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5--flash-FF6F00?style=for-the-badge&logo=google)](https://ai.google.dev/)

## Descripcion

**Stttock** es una plataforma SaaS moderna para la gestion inteligente de bares y restaurantes. Integra control de inventario en tiempo real, punto de venta (POS) con drag & drop, gestion de mesas, analisis de ventas, proyecciones predictivas con IA (Gemini 2.5-flash), suscripciones con Stripe en modo live y un flujo de onboarding completo.

---

## Features Principales

### Sistema Multi-Establecimiento
- Multiples sucursales bajo una misma cuenta
- Configuracion independiente por establecimiento (incluyendo tasa de impuesto)
- Dashboard consolidado para cadenas

### Dashboard Interactivo
- Metricas clave en tiempo real
- Graficos de ventas por periodo (dia/semana/mes)
- Alertas de stock critico y bajo con semaforo visual
- Cards con estadisticas de productos, menus e insumos

### Gestion de Insumos Avanzada
- Control por unidades (botellas, items, kg)
- Tracking de contenido (ml, g) con resta automatica en ventas
- 7 categorias inteligentes con defaults automaticos
- Semaforo visual de inventario (critico/bajo/optimo)
- Importacion masiva desde CSV/Excel (con hardening de dedup y truncamiento)
- Optimo de inventario configurable

### Gestion de Productos y Menus
- Creacion de productos con recetas detalladas
- Ingredientes vinculados a insumos
- Multiples menus (temporadas, eventos, happy hour)
- Importacion de menus con Google Gemini 2.5-flash AI (structured JSON mode)
- Precios configurables por producto

### Sistema de Mesas y POS
- Editor visual de layout de mesas con drag & drop
- Configuracion de secciones (patio, bar, terraza)
- Auto-guardado del layout (debounced 800ms)
- Estados de mesa en tiempo real
- Punto de venta integrado con:
  - Seleccion rapida de productos
  - Division de cuentas
  - Multiples metodos de pago
  - Generacion e impresion de recibos
  - Propinas

### Registro de Ventas
- Historial completo de transacciones
- Top 5 productos mas vendidos
- Ticket promedio y ventas por periodo
- Deduccion automatica de inventario

### Proyecciones Inteligentes con IA
- Analisis predictivo basado en Gemini 2.5-flash
- Calculo de dias hasta agotamiento
- Recomendaciones de compra
- Alertas tempranas de reabastecimiento

### Sistema de Suscripciones (Stripe Live)
- Planes flexibles:
  - **Bar Sucursal Mensual:** $899 MXN/mes
  - **Bar Sucursal Anual:** $8,400 MXN/ano
  - **Cadena Stttock:** $2,999 MXN/mes
- Trial de 30 dias gratis
- Gestion completa con Stripe en modo live
- Webhooks para eventos de pago
- Emails transaccionales via Resend (bienvenida, trial expirando, pago fallido, confirmacion)

### Onboarding
- Wizard de configuracion paso a paso post-registro
- Cuestionario interactivo con seleccion de roles por establecimiento
- Iconos SVG limpios (sin emojis)
- Importacion de datos inicial

### Multiidioma
- Espanol (por defecto)
- English
- Cambio en tiempo real

### UI/UX
- Rebrand completo a Stttock con nuevos logos (light/dark)
- Tema oscuro con gradientes animados
- Botones con efecto glow
- Sidebar rediseñado con estilos unificados
- Diseño 100% responsivo

### Seguridad
- Rate limiting por endpoint (sliding window in-memory):
  - `/api/quotes`: 5 req / 10 min
  - `/api/menu/parse`: 10 req / 5 min
  - `/api/stripe/checkout`: 5 req / 10 min
- Security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy
- Row Level Security (RLS) en Supabase
- Error boundaries (app-level + dashboard-level)
- Webhook replay protection

### Claude Code Hooks (DX)
El proyecto incluye 8 hooks automaticos para Claude Code en `.claude/settings.json`:
- **PreToolUse:** bloqueo de comandos peligrosos, proteccion de archivos sensibles, tests obligatorios antes de PR, audit log de comandos
- **PostToolUse:** auto-format con Prettier, ESLint fix con reporte de errores
- **Stop:** auto-commit atomico al finalizar cada tarea

---

## Demo

Prueba la aplicacion en modo demo sin necesidad de registro:

**[Ver Demo en Vivo](https://flowstock-686958505968.us-central1.run.app/demo)**

- Acceso inmediato sin autenticacion
- Datos de ejemplo precargados
- Todas las funcionalidades disponibles
- Sin persistencia (datos en memoria)

---

## Stack Tecnologico

### Frontend
| Tecnologia | Version | Uso |
|------------|---------|-----|
| Next.js | 16 | Framework React con App Router |
| React | 19 | Biblioteca UI |
| TypeScript | 5.9 | Tipado estatico |
| Tailwind CSS | 4.1 | Estilos utility-first |
| shadcn/ui | Latest | Componentes base |
| Radix UI | Latest | Primitivas accesibles |
| Recharts | Latest | Graficos |

### Backend & Servicios
| Tecnologia | Uso |
|------------|-----|
| Supabase | PostgreSQL + Auth + Realtime |
| Next.js API Routes | Server actions + endpoints |
| Stripe (Live) | Pagos y suscripciones |
| Google Gemini 2.5-flash | IA para menus y proyecciones |
| Resend | Emails transaccionales |

### Infraestructura
| Tecnologia | Uso |
|------------|-----|
| Google Cloud Run | Hosting con auto-scaling |
| Cloud Build | CI/CD |
| Artifact Registry | Imagenes Docker |

---

## Instalacion Local

### Prerrequisitos
- Node.js 20.x+
- pnpm 9.x
- Cuenta de Supabase
- Cuenta de Stripe

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/ArkVault/barflow.git
cd barflow
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

4. **Ejecutar en desarrollo**
```bash
pnpm dev
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

---

## Scripts Disponibles

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de produccion
pnpm start        # Servidor de produccion
pnpm lint         # ESLint
pnpm lint:fix     # Arreglar lint errors
pnpm typecheck    # Verificar tipos TypeScript
pnpm test         # Tests de dominio
pnpm validate     # lint + typecheck + build
```

---

## Estructura del Proyecto

```
stttock/
├── app/
│   ├── api/
│   │   ├── menu/parse/            # AI menu parsing (Gemini 2.5)
│   │   ├── quotes/                # Cotizaciones
│   │   ├── stripe/
│   │   │   ├── checkout/          # Checkout sessions
│   │   │   └── webhook/           # Stripe webhooks
│   │   ├── supplies/              # CRUD insumos
│   │   └── webhooks/stripe/       # Webhook alias
│   ├── auth/                      # Login / Sign-up
│   ├── dashboard/                 # Dashboard produccion
│   │   ├── configuracion/         # Settings + tax rate
│   │   ├── cuenta/                # Mi cuenta
│   │   ├── insumos/               # Inventario
│   │   ├── operaciones/           # POS
│   │   ├── planner/               # Planificador
│   │   ├── productos/             # Productos
│   │   ├── proyecciones/          # Proyecciones IA
│   │   ├── punto-de-venta/        # POS alternativo
│   │   └── ventas/                # Ventas
│   ├── demo/                      # Modo demo completo
│   ├── error.tsx                  # Error boundary (app)
│   └── layout.tsx                 # Root layout
├── components/
│   ├── configuracion/             # Settings form
│   ├── onboarding/                # Wizard de onboarding
│   ├── pos/                       # POS context + tabs
│   ├── presentation/              # Demo UI components
│   ├── shells/                    # Demo/Prod shells
│   └── ui/                        # shadcn/ui
├── lib/
│   ├── dtos/                      # Zod schemas
│   ├── email/                     # Resend templates
│   ├── features/
│   │   ├── dashboard/server/      # View models
│   │   └── operations/            # Domain + use-cases + repos
│   ├── security/                  # Rate limit, audit, guards
│   ├── services/                  # Business services
│   ├── stripe/                    # Stripe config
│   └── supabase/                  # Client + server + transactions
├── .claude/
│   ├── settings.json              # Claude Code hooks config
│   └── hooks/                     # Hook scripts (5 files)
├── supabase/migrations/           # SQL migrations
├── Dockerfile
├── cloudbuild.yaml
└── package.json
```

---

## Base de Datos

### Tablas Principales

| Tabla | Descripcion |
|-------|-------------|
| `users` | Usuarios del sistema |
| `establishments` | Bares/restaurantes (con tax_rate) |
| `insumos` | Inventario de insumos |
| `products` | Productos del menu |
| `product_ingredients` | Recetas de productos |
| `menus` | Menus del establecimiento |
| `menu_products` | Productos por menu |
| `sales` | Registro de ventas |
| `sale_items` | Items por venta |
| `tables` | Mesas del establecimiento |
| `sections` | Secciones del layout |
| `bars` | Barras de servicio |

---

## Branch Strategy

```
main         ← produccion estable
development  ← trabajo activo (merge a main via PR)
```

### Commits Semanticos
- `feat:` Nueva funcionalidad
- `fix:` Correccion de bug
- `refactor:` Refactorizacion
- `test:` Tests
- `chore:` Mantenimiento
- `docs:` Documentacion

---

## Changelog

### v2.0.0 (2026-04-04) — Stttock Unified Release
- Rebrand completo: Flowstock a **Stttock** con nuevos logos (light/dark)
- Sidebar rediseñado con estilos unificados (gris hover/active)
- Stripe en modo **live** con precios actualizados (Bar $899/mes, Cadena $2,999/mes)
- Migracion de Gemini 2.0-flash-exp a **Gemini 2.5-flash** con structured JSON mode
- Onboarding wizard completo (cuestionario + server actions)
- Onboarding questionnaire con SVG icons, dropdowns por rol, sin emojis
- Auto-save del layout POS con debounce de 800ms
- Planner Excel import hardening (dedup, truncamiento, query directa a DB)
- Emails transaccionales via Resend (5 templates: welcome, trial-ending, subscription-confirmed, payment-failed, quote)
- Tasa de impuesto configurable por establecimiento (DB migration + settings form + server action)
- Error boundaries a nivel de app y dashboard
- Rate limiting por endpoint (sliding window in-memory)
- Security headers completos (HSTS, CSP, X-Frame-Options, Permissions-Policy)
- Webhook replay protection con store de IDs
- Claude Code hooks: 8 hooks de seguridad y automatizacion (`.claude/settings.json`)
- Domain-driven POS refactor con unit tests (9/9 passing)
- Refactor de API routes: rutas canonicas con alias re-export
- Atomic multi-table writes via Postgres RPC + Zod DTO schemas
- Dashboard view models (server-side data loading)
- Modo demo completo (`/demo/*` con 8 rutas)
- Account page completa (`/dashboard/cuenta` — 1,174 lineas)
- Settings page con guardado real via server action
- Recibo POS: generacion e impresion
- Limpieza de branches: unificacion en `main` + `development`

### v1.1.0 (2025-12-15) — Cloud Run Release
- Deploy a Google Cloud Run
- Sistema de pagos con Stripe (test mode)
- Editor visual de mesas drag & drop
- Sistema de reservaciones
- Autenticacion completa con Supabase
- Dashboard con metricas en tiempo real
- Soporte multiidioma (ES/EN)
- UI premium con efectos neumorficos

### v1.0.0 (2025-11-28) — Initial Release
- Sistema de inventario avanzado
- Categorias inteligentes (7 categorias con defaults)
- Sistema de menus
- Proyecciones con IA
- Diseño neumórfico

---

## Roadmap

### v2.1 (Proximo)
- [ ] Flow de onboarding post-signup conectado a la app
- [ ] Welcome email trigger en sign-up
- [ ] Cloud Build trigger con substitution variables persistentes
- [ ] Reportes en PDF exportables

### v2.2
- [ ] Integracion completa con OpenTable
- [ ] Notificaciones push
- [ ] Sistema de roles y permisos granular
- [ ] App movil (React Native)

### v3.0
- [ ] IA para recomendaciones de menu
- [ ] Prediccion de demanda con ML
- [ ] Marketplace de proveedores
- [ ] API publica para integraciones

---

## Licencia

Este proyecto esta bajo la Licencia MIT.

---

**Hecho con fuerza por el equipo de Stttock**
