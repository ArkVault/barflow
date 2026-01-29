# 🍹 Flowstock - Sistema de Gestión para Bares y Restaurantes

[![Deployed on Cloud Run](https://img.shields.io/badge/Deployed%20on-Cloud%20Run-4285F4?style=for-the-badge&logo=google-cloud)](https://barflow-686958505968.us-central1.run.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com/)

## 📋 Descripción

**Flowstock** es una plataforma SaaS moderna y completa para la gestión inteligente de bares y restaurantes. Integra control de inventario en tiempo real, punto de venta (POS), gestión de mesas y reservaciones, análisis de ventas y proyecciones predictivas basadas en IA.

---

## ✨ Features Principales

### 🏪 **Sistema Multi-Establecimiento**
- Múltiples sucursales bajo una misma cuenta
- Configuración independiente por establecimiento
- Dashboard consolidado para cadenas

### 📊 **Dashboard Interactivo**
- Métricas clave en tiempo real
- Gráficos de ventas por periodo (día/semana/mes)
- Alertas de stock crítico y bajo
- Cards con estadísticas de productos, menús e insumos

### 🧪 **Gestión de Insumos Avanzada**
- Control por unidades (botellas, items, kg)
- Tracking de contenido (ml, g) con resta automática en ventas
- 7 categorías inteligentes con defaults automáticos:
  - Bebidas Alcohólicas
  - Refrescos y Mixers
  - Lácteos
  - Frutas y Vegetales
  - Hielos y Congelados
  - Desechables
  - Otros
- Semáforo visual de inventario (crítico/bajo/óptimo)
- Importación masiva desde CSV/Excel
- Óptimo de inventario configurable

### 🍸 **Gestión de Productos y Menús**
- Creación de productos con recetas detalladas
- Ingredientes vinculados a insumos
- Múltiples menús (temporadas, eventos, happy hour)
- Un solo menú activo a la vez
- Historial de menús anteriores
- Precios configurables por producto
- Imágenes de productos

### 🪑 **Sistema de Mesas y POS**
- Editor visual de layout de mesas drag & drop
- Configuración de secciones (patio, bar, terraza)
- Barras de servicio configurables
- Estados de mesa en tiempo real
- Punto de venta integrado con:
  - Selección rápida de productos
  - Modificadores y notas
  - División de cuentas
  - Propinas
  - Múltiples métodos de pago

### 📅 **Sistema de Reservaciones**
- Integración con OpenTable (próximamente)
- Reservaciones manuales
- Vista de calendario
- Notificaciones de llegada
- Manejo de no-shows

### 💰 **Registro de Ventas**
- Historial completo de transacciones
- Top 5 productos más vendidos
- Ticket promedio
- Ventas por periodo
- Deducción automática de inventario
- Integración con Stripe para pagos

### 🔮 **Proyecciones Inteligentes con IA**
- Análisis predictivo basado en Gemini AI
- Cálculo de días hasta agotamiento
- Recomendaciones de compra
- Alertas tempranas de reabastecimiento
- Proyecciones semanales y mensuales

### 💳 **Sistema de Suscripciones**
- Planes flexibles:
  - **1 Bar Mensual:** $1,999 MXN/mes
  - **1 Bar Anual:** $19,980/año (2 meses gratis)
  - **Cadena (5 sucursales):** $3,999/mes
- Trial de 30 días gratis
- Gestión con Stripe
- Webhooks para eventos de pago

### 🌍 **Multiidioma**
- Español (por defecto)
- English
- Cambio en tiempo real
- Persistencia en localStorage

### 🎨 **UI/UX Premium**
- Diseño neumórfico con efectos 3D
- Tema oscuro Monokai Ristretto
- Gradientes animados
- Botones con efecto glow
- Glassmorphism
- Micro-animaciones
- Diseño 100% responsivo

### 🔐 **Autenticación y Seguridad**
- Login con email/contraseña
- Magic link (próximamente)
- OAuth con Google (próximamente)
- Row Level Security (RLS) en Supabase
- Middleware de protección de rutas
- Headers de seguridad (X-Frame-Options, CSP)

---

## 🚀 Demo

Prueba la aplicación en modo demo sin necesidad de registro:

**[🌐 Ver Demo en Vivo](https://barflow-686958505968.us-central1.run.app/demo)**

### Modo Demo
- ✅ Acceso inmediato sin autenticación
- ✅ Datos de ejemplo precargados
- ✅ Todas las funcionalidades disponibles
- ✅ Sin persistencia (datos en memoria)

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 16.0.7 | Framework React con App Router |
| React | 19.2.1 | Biblioteca UI |
| TypeScript | 5.9 | Tipado estático |
| Tailwind CSS | 4.1.9 | Estilos utility-first |
| shadcn/ui | Latest | Componentes base |
| Radix UI | Latest | Primitivas accesibles |
| Lucide React | 0.454 | Iconos |
| Recharts | Latest | Gráficos |

### Backend & Base de Datos
| Tecnología | Uso |
|------------|-----|
| Supabase | PostgreSQL + Auth + Storage |
| Next.js API Routes | Endpoints del servidor |
| Stripe | Pagos y suscripciones |
| Google Gemini AI | Proyecciones inteligentes |

### Infraestructura
| Tecnología | Uso |
|------------|-----|
| Google Cloud Run | Hosting con auto-scaling |
| Cloud Build | CI/CD |
| Artifact Registry | Imágenes Docker |
| GitHub Actions | Validación de código |

---

## 📦 Instalación Local

### Prerrequisitos
- Node.js 20.x
- pnpm 9.x
- Cuenta de Supabase
- Cuenta de Stripe (test mode)

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/gibrann/barmode.git
cd barmode
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

## 🚀 Deployment

### Google Cloud Run (Producción)

```bash
# Autenticar con GCP
gcloud auth login

# Deploy con Cloud Build
gcloud builds submit --config=cloudbuild.yaml --region=us-central1
```

### Configuración de Costos Optimizada
| Configuración | Valor |
|---------------|-------|
| Min Instances | 0 (escala a cero) |
| Max Instances | 2 |
| Memory | 256Mi |
| CPU | 1 (con throttling) |

**Costo estimado:** $0-5 USD/mes para MVP

---

## 📁 Estructura del Proyecto

```
barmode/
├── app/
│   ├── api/                    # API Routes
│   │   ├── health/             # Health check endpoint
│   │   ├── create-checkout-session/
│   │   ├── webhooks/stripe/    # Stripe webhooks
│   │   └── parse-menu/         # AI menu parsing
│   ├── demo/                   # Páginas del modo demo
│   │   ├── page.tsx           # Dashboard demo
│   │   ├── planner/           # Planificador
│   │   ├── insumos/           # Gestión de insumos
│   │   ├── productos/         # Gestión de productos
│   │   ├── ventas/            # Registro de ventas
│   │   ├── pos/               # Punto de venta
│   │   ├── mesas/             # Layout de mesas
│   │   └── proyecciones/      # IA proyecciones
│   ├── dashboard/             # Dashboard de producción
│   │   ├── page.tsx           # Panel principal
│   │   ├── insumos/           # Insumos (prod)
│   │   ├── productos/         # Productos (prod)
│   │   ├── ventas/            # Ventas (prod)
│   │   ├── operaciones/       # Operaciones
│   │   ├── proyecciones/      # Proyecciones (prod)
│   │   └── cuenta/            # Mi cuenta
│   ├── login/                 # Autenticación
│   ├── register/              # Registro
│   └── pricing/               # Página de precios
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── sidebar-nav.tsx        # Navegación lateral
│   ├── demo-sidebar.tsx       # Sidebar modo demo
│   ├── glow-button.tsx        # Botón con efecto glow
│   ├── inventory-planner.tsx  # Planificador
│   ├── menu-manager.tsx       # Gestor de menús
│   ├── table-editor.tsx       # Editor de mesas
│   └── pos-interface.tsx      # Interfaz POS
├── lib/
│   ├── supabase/              # Cliente Supabase
│   ├── stripe/                # Configuración Stripe
│   ├── translations.ts        # Sistema i18n
│   ├── categories-config.ts   # Config de categorías
│   └── utils.ts               # Utilidades
├── supabase/
│   └── migrations/            # Migraciones SQL
├── .github/
│   ├── workflows/             # CI/CD pipelines
│   ├── CODEOWNERS             # Propietarios de código
│   └── PULL_REQUEST_TEMPLATE.md
├── Dockerfile                 # Imagen Docker optimizada
├── cloudbuild.yaml            # Config Cloud Build
└── package.json
```

---

## 🗄️ Base de Datos

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del sistema |
| `establishments` | Bares/restaurantes |
| `insumos` | Inventario de insumos |
| `products` | Productos del menú |
| `product_ingredients` | Recetas de productos |
| `menus` | Menús del establecimiento |
| `menu_products` | Productos por menú |
| `sales` | Registro de ventas |
| `sale_items` | Items por venta |
| `tables` | Mesas del establecimiento |
| `sections` | Secciones del layout |
| `bars` | Barras de servicio |
| `reservations` | Reservaciones |

---

## 📝 Scripts Disponibles

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm start        # Servidor de producción
pnpm lint         # ESLint
pnpm lint:fix     # Arreglar lint errors
pnpm typecheck    # Verificar tipos
pnpm validate     # lint + typecheck + build
```

---

## 🔄 CI/CD

### Pull Requests
- ✅ ESLint automático
- ✅ TypeScript check
- ✅ Build validation

### Deploy a Producción
- 🚀 Manual trigger desde GitHub Actions
- 🚀 Automático en releases/tags
- 🚀 Cloud Build con Docker multi-stage

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/nueva-feature`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva feature'`)
4. Push a la rama (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

### Commits Semánticos
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Estilos/formateo
- `refactor:` Refactorización
- `perf:` Mejoras de rendimiento
- `test:` Tests
- `chore:` Tareas de mantenimiento

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 📞 Contacto

- **Website:** [barmode.app](https://barflow-686958505968.us-central1.run.app)
- **GitHub:** [@gibrann](https://github.com/gibrann)

---

## 📝 Changelog

### v1.1.0 (2025-12-15) - Cloud Run Release
- 🚀 Deploy a Google Cloud Run
- 💳 Sistema de pagos con Stripe
- 🪑 Editor visual de mesas drag & drop
- 📅 Sistema de reservaciones
- 🔐 Autenticación completa con Supabase
- 📊 Dashboard con métricas en tiempo real
- 🌍 Soporte multiidioma (ES/EN)
- 🎨 UI premium con efectos neumórficos

### v1.0.0 (2025-11-28) - Initial Release
- 🎉 Sistema de Inventario Avanzado
- 🏷️ Categorías Inteligentes
- 📋 Sistema de Menús
- 🔮 Proyecciones con IA
- 🎨 Diseño Neumórfico

---

## 🗺️ Roadmap

### v1.2 (Próximamente)
- [ ] Integración completa con OpenTable
- [ ] Reportes en PDF exportables
- [ ] Notificaciones push
- [ ] App móvil (React Native)

### v1.3
- [ ] Integración con APIs de proveedores
- [ ] Sistema de roles y permisos granular
- [ ] Integración con sistemas POS externos

### v2.0
- [ ] IA para recomendaciones de menú
- [ ] Predicción de demanda con ML
- [ ] Marketplace de proveedores
- [ ] API pública para integraciones

---

**Hecho con ❤️ por el equipo de Flowstock**
