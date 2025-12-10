# 🗺️ ROADMAP DE DESARROLLO - BARMODE

**Última actualización**: Diciembre 2024  
**Versión actual**: 1.0 (MVP)  
**Próxima versión**: 2.0 (Multi-sucursal + Operaciones + POS)

---

## 💳 INTEGRACIÓN STRIPE - PLAN HÍBRIDO

### Estado Actual ✅
**Implementación propia** con cobertura del 95%:
- ✅ 12 Webhooks implementados (checkout, subscription lifecycle, payments, disputes)
- ✅ Detección automática de tipo de plan (bar_monthly, bar_yearly, chain)
- ✅ Manejo de pagos fallidos con escalación (past_due → unpaid)
- ✅ Trial ending warning (3 días antes)
- ✅ Subscription pause/resume
- ✅ Realtime updates via Supabase

### Plan Futuro 📊
**Migración gradual a `stripe-sync-engine`** cuando necesitemos:
- Analytics de facturación con SQL
- Reportes de MRR, churn, LTV
- Dashboard financiero avanzado
- Historial completo de invoices

### Webhooks Cubiertos

| Categoría | Eventos |
|-----------|---------|
| Checkout | `checkout.session.completed` |
| Subscription | `created`, `updated`, `deleted`, `paused`, `resumed`, `trial_will_end` |
| Payments | `payment_succeeded`, `payment_failed`, `payment_action_required` |
| Disputes | `dispute.created`, `dispute.closed` |
| Refunds | `charge.refunded` |

---

## 📊 ANÁLISIS DEL CODEBASE ACTUAL

### Estructura de Directorios

```
/app
├── api/                    # 8 endpoints API
│   ├── create-checkout-session/
│   ├── parse-menu/
│   ├── save-supplies/
│   ├── stats/
│   ├── stripe/
│   ├── supplies/
│   ├── supply-schema/
│   └── webhooks/
├── auth/                   # 4 páginas de autenticación
│   ├── login/
│   ├── sign-up/
│   ├── callback/
│   └── forgot-password/
├── dashboard/              # 7 secciones del dashboard
│   ├── page.tsx            # Panel de Control
│   ├── planner/            # Planner de Inventario
│   ├── insumos/            # Gestión de Insumos
│   ├── productos/          # Gestión de Productos
│   ├── ventas/             # Ventas y Contabilidad
│   ├── proyecciones/       # Proyecciones con IA
│   ├── cuenta/             # Configuración de Cuenta
│   └── configuracion/      # Configuración General
└── demo/                   # 6 páginas de demostración
    ├── page.tsx
    ├── planner/
    ├── insumos/
    ├── productos/
    ├── ventas/
    └── proyecciones/

/components (47 componentes)
├── UI Components (13 shadcn/ui)
├── Dashboard Components
├── Inventory Components
├── Sales Components
├── Chart Components
└── Subscription Components

/lib
├── supabase/               # Cliente Supabase
├── stripe/                 # Cliente Stripe
├── supply-categories.ts    # Categorías de insumos
├── translations.ts         # Multi-idioma ES/EN
├── stock-utils.ts          # Utilidades de inventario
└── mock-data.ts            # Datos de demostración

/hooks
├── use-language.ts         # Hook de idioma
└── use-subscription.ts     # Hook de suscripción

/contexts
├── auth-context.tsx        # Contexto de autenticación
└── period-context.tsx      # Contexto de período

/supabase/migrations
├── add_subscription_fields.sql
├── enable_rls_all_tables.sql
└── enable_rls_all_tables_fixed.sql
```

---

## ✅ ESTADO ACTUAL (v1.0 - MVP) - DETALLADO

### 🏠 Panel de Control (Dashboard)
**Ruta**: `/dashboard`  
**Estado**: ✅ Implementado

**Componentes**:
- ✅ `stats-overview.tsx` - Métricas principales (insumos, productos, menú activo)
- ✅ `stock-traffic-light.tsx` - Semáforo de stock (crítico/bajo/óptimo)
- ✅ `stock-half-circle.tsx` - Indicador visual de stock
- ✅ `urgent-supplies-alert.tsx` - Alertas de insumos urgentes
- ✅ `animated-sales-chart.tsx` - Gráfico de ventas animado
- ✅ `neon-donut-chart.tsx` - Gráfico de dona con estilo neón

**Funcionalidades**:
- ✅ Vista general del negocio
- ✅ Métricas en tiempo real
- ✅ Alertas de stock bajo
- ✅ Gráficos de ventas
- ⏳ Pendiente: Métricas por sucursal (multi-sucursal)

---

### 📋 Planner de Inventario
**Ruta**: `/dashboard/planner`  
**Estado**: ✅ Implementado

**Componentes**:
- ✅ `inventory-planner.tsx` - Componente principal (23KB)
- ✅ `purchase-list-dialog.tsx` - Diálogo de lista de compras
- ✅ `restock-supply-dialog.tsx` - Diálogo para reabastecer

**Funcionalidades**:
- ✅ Planificación de inventario
- ✅ Lista de compras automática
- ✅ Sugerencias de reabastecimiento
- ✅ Estados de stock (crítico, bajo, óptimo)
- ✅ Categorización de insumos

---

### 📦 Gestión de Insumos
**Ruta**: `/dashboard/insumos`  
**Estado**: ✅ Implementado

**Componentes**:
- ✅ `supplies-table.tsx` - Tabla de insumos (10KB)
- ✅ `add-supply-dialog.tsx` - Agregar insumo
- ✅ `edit-supply-dialog.tsx` - Editar insumo (13KB)
- ✅ `delete-supply-dialog.tsx` - Eliminar insumo
- ✅ `receive-supply-dialog.tsx` - Recibir insumo

**Funcionalidades**:
- ✅ CRUD completo de insumos
- ✅ Categorización (Bebidas alcohólicas, Mezcladores, Otros)
- ✅ Unidades de medida (ml, pz, kg, L)
- ✅ Contenido total y unidades óptimas
- ✅ Cálculo automático de stock
- ✅ Filtros y búsqueda

---

### 🛒 Gestión de Productos
**Ruta**: `/dashboard/productos`  
**Estado**: ✅ Implementado

**Componentes**:
- ✅ `products-table.tsx` - Tabla de productos
- ✅ `add-product-dialog.tsx` - Agregar producto (12KB)
- ✅ `edit-product-dialog.tsx` - Editar producto (12KB)
- ✅ `delete-product-dialog.tsx` - Eliminar producto
- ✅ `view-recipe-dialog.tsx` - Ver receta/ingredientes
- ✅ `menu-manager.tsx` - Gestión de menús (15KB)
- ✅ `menu-upload.tsx` - Subir menú con IA

**Funcionalidades**:
- ✅ CRUD completo de productos
- ✅ Asociación de ingredientes (recetas)
- ✅ Gestión de menús múltiples
- ✅ Menú activo
- ✅ Precios y costos
- ✅ Importar menú con IA (parse-menu)

---

### 📊 Ventas y Contabilidad
**Ruta**: `/dashboard/ventas`  
**Estado**: ✅ Parcialmente Implementado

**Componentes**:
- ✅ `sales-table.tsx` - Tabla de ventas
- ✅ `sales-stats.tsx` - Estadísticas de ventas
- ✅ `sales-chart.tsx` - Gráfico de ventas
- ✅ `sales-chart-simple.tsx` - Gráfico simplificado
- ✅ `record-sale-dialog.tsx` - Registrar venta

**Funcionalidades**:
- ✅ Registro de ventas
- ✅ Historial de ventas
- ✅ Estadísticas básicas
- ✅ Gráficos de ventas
- ⏳ **Pendiente: Sistema POS completo**
- ⏳ Pendiente: Métodos de pago
- ⏳ Pendiente: Tickets/Facturas
- ⏳ Pendiente: Sesiones de caja

---

### 📈 Proyecciones Inteligentes
**Ruta**: `/dashboard/proyecciones`  
**Estado**: ✅ Implementado

**Componentes**:
- ✅ `projection-view.tsx` - Vista principal (18KB)
- ✅ `projections-summary.tsx` - Resumen de proyecciones
- ✅ `inventory-projection-chart.tsx` - Gráfico de inventario (18KB)
- ✅ `sales-projection-chart.tsx` - Gráfico de ventas (13KB)
- ✅ `order-suggestions-table.tsx` - Sugerencias de pedidos
- ✅ `generate-projections-button.tsx` - Botón generar

**Funcionalidades**:
- ✅ Proyecciones de inventario (semana/mes)
- ✅ Proyecciones de ventas
- ✅ Sugerencias de pedidos
- ✅ Modo temporada alta
- ✅ Análisis predictivo con IA

---

### 👤 Cuenta de Usuario
**Ruta**: `/dashboard/cuenta`  
**Estado**: ⏳ Estructura creada

**Funcionalidades pendientes**:
- ⏳ Ver perfil de usuario
- ⏳ Cambiar contraseña
- ⏳ Actualizar email
- ⏳ Preferencias de notificaciones
- ⏳ Historial de actividad

---

### ⚙️ Configuración
**Ruta**: `/dashboard/configuracion`  
**Estado**: ⏳ Estructura creada

**Funcionalidades pendientes**:
- ⏳ Configurar establecimiento
- ⏳ Logo y branding
- ⏳ Zona horaria
- ⏳ Moneda
- ⏳ Impuestos
- ⏳ Métodos de pago
- ⏳ Impresoras

---

### 🔐 Autenticación
**Estado**: ✅ Implementado

**Páginas**:
- ✅ `/auth/login` - Inicio de sesión
- ✅ `/auth/sign-up` - Registro
- ✅ `/auth/callback` - Callback OAuth
- ✅ `/auth/forgot-password` - Recuperar contraseña

**Componentes**:
- ✅ `auth-context.tsx` - Contexto de autenticación
- ✅ Video de fondo en login
- ✅ Logos dinámicos por tema

---

### 💳 Sistema de Suscripciones
**Estado**: ✅ Parcialmente Implementado

**Componentes**:
- ✅ `subscription-modal.tsx` - Modal de suscripción (13KB)
- ✅ `subscription-guard.tsx` - Protección de rutas
- ✅ `trial-banner.tsx` - Banner de trial
- ✅ `upgrade-plan-button.tsx` - Botón de upgrade (13KB)

**Funcionalidades**:
- ✅ 3 planes configurados (Bar Mensual, Bar Anual, Cadena)
- ✅ Trial de 30 días
- ✅ Hook de suscripción
- ✅ Endpoints de Stripe
- ✅ Webhooks de Stripe
- ⏳ Pendiente: Configurar productos en Stripe Dashboard
- ⏳ Pendiente: Probar flujo de pago completo

---

### 🌐 Internacionalización
**Estado**: ✅ Implementado

**Componentes**:
- ✅ `language-toggle.tsx` - Toggle de idioma
- ✅ `translations.ts` - Traducciones ES/EN
- ✅ `use-language.ts` - Hook de idioma

---

### 🎨 UI/UX
**Estado**: ✅ Implementado

**Componentes**:
- ✅ `sidebar-nav.tsx` - Navegación lateral
- ✅ `demo-sidebar.tsx` - Sidebar de demo
- ✅ `dashboard-nav.tsx` - Navegación del dashboard
- ✅ `dashboard-layout.tsx` - Layout principal
- ✅ `page-header.tsx` - Encabezado de página
- ✅ `theme-toggle.tsx` - Toggle oscuro/claro
- ✅ `theme-provider.tsx` - Provider de tema

**Características**:
- ✅ Diseño neumórfico
- ✅ Modo oscuro/claro
- ✅ Responsive design
- ✅ Logos dinámicos por tema
- ✅ 13 componentes shadcn/ui

---

### 🔒 Seguridad
**Estado**: ✅ Implementado

**Migraciones**:
- ✅ `enable_rls_all_tables_fixed.sql` - RLS habilitado
- ✅ `add_subscription_fields.sql` - Campos de suscripción

**Características**:
- ✅ Row-Level Security (RLS)
- ✅ Políticas por usuario
- ✅ Aislamiento de datos

---

## 🚀 ROADMAP DETALLADO POR FASE

### Fase 0: Finalizar MVP (ACTUAL - Diciembre 2024) ⏳

**Prioridad**: CRÍTICA  
**Estimación**: 1-2 semanas  
**Estado**: 🔄 En Progreso

**Tareas pendientes**:
- [ ] **Configurar Stripe completamente**
  - [ ] Crear 3 productos en Stripe Dashboard
  - [ ] Obtener Price IDs
  - [ ] Actualizar `.env.local`
  - [ ] Probar flujo de pago completo
- [ ] **Página Cuenta** (`/dashboard/cuenta`)
  - [ ] Ver perfil de usuario
  - [ ] Cambiar contraseña
  - [ ] Actualizar información
- [ ] **Página Configuración** (`/dashboard/configuracion`)
  - [ ] Configurar establecimiento
  - [ ] Logo y branding
  - [ ] Preferencias generales

---

### Fase 1: Sistema Multi-Sucursal (Plan Cadena) 🏢

**Prioridad**: Alta  
**Estimación**: 3-4 semanas  
**Inicio**: Q1 2025 (Enero)

#### 1.1 Infraestructura de Base de Datos
- [ ] Crear tabla `branches` (sucursales)
- [ ] Agregar `branch_id` a tablas existentes
- [ ] Crear políticas RLS para multi-sucursal
- [ ] Función para verificar límite de sucursales según plan

#### 1.2 Gestión de Sucursales
- [ ] Página `/dashboard/sucursales`
- [ ] Componente `BranchSelector`
- [ ] Crear/Editar/Eliminar sucursales
- [ ] Validación de límite por plan

#### 1.3 Dashboard Consolidado
- [ ] Vista consolidada de todas las sucursales
- [ ] Métricas agregadas
- [ ] Gráficos comparativos

#### 1.4 Inventario Centralizado
- [ ] Vista de inventario multi-sucursal
- [ ] Sistema de transferencias entre sucursales
- [ ] Alertas por sucursal

---

### Fase 2: Sistema de Operaciones (Gestión de Mesas) 🍽️

**Prioridad**: Media  
**Estimación**: 4-5 semanas  
**Inicio**: Q2 2025 (Abril)

#### 2.1 Infraestructura
- [ ] Tablas: `sections`, `tables`, `bar_seats`, `table_orders`

#### 2.2 Editor Visual de Layout
- [ ] Canvas interactivo (react-konva)
- [ ] Crear/Editar secciones
- [ ] Crear/Mover/Redimensionar mesas
- [ ] Lugares en barra
- [ ] Guardar/Cargar layout

#### 2.3 Gestión en Tiempo Real
- [ ] Estados de mesa (disponible, ocupada, reservada, limpieza)
- [ ] Asignar mesa a clientes
- [ ] Tomar órdenes desde mesa
- [ ] Cerrar cuenta

#### 2.4 Reportes
- [ ] Tasa de ocupación
- [ ] Ingresos por mesa
- [ ] Tiempo promedio

---

### Fase 2.5: Sistema de Punto de Venta (POS) 💳

**Prioridad**: Alta  
**Estimación**: 3-4 semanas  
**Inicio**: Q2-Q3 2025 (Mayo-Julio)

**NOTA IMPORTANTE**: El POS será una **página independiente** en el sidebar, no dentro de Ventas.

**Justificación**:
- 🎯 El POS es una herramienta de uso CONSTANTE durante el servicio
- 🎯 Ventas es para REPORTES y ANÁLISIS histórico
- 🎯 El POS requiere una interfaz optimizada para rapidez
- 🎯 Diferentes usuarios usarán cada sección:
  - **POS**: Cajeros, meseros
  - **Ventas**: Gerentes, contadores

#### 2.5.1 Infraestructura
- [ ] Tablas: `pos_sessions`, `pos_transactions`, `payment_methods`, `cash_movements`

#### 2.5.2 Interfaz de POS (`/dashboard/pos`)
- [ ] Grid de productos (touch-optimizado)
- [ ] Carrito de compra
- [ ] Panel de pago
- [ ] Teclado numérico

#### 2.5.3 Sesiones de Caja
- [ ] Apertura de caja
- [ ] Cierre de caja con conteo
- [ ] Movimientos de caja
- [ ] Historial de sesiones

#### 2.5.4 Métodos de Pago
- [ ] Efectivo, Tarjeta, Transferencia
- [ ] Pago dividido
- [ ] Propinas

#### 2.5.5 Tickets
- [ ] Template personalizable
- [ ] Impresión térmica
- [ ] PDF y email

#### 2.5.6 Reportes de POS
- [ ] Ventas del día
- [ ] Por cajero
- [ ] Diferencias de caja

---

### Fase 3: Integraciones y API 🔌

**Prioridad**: Baja  
**Estimación**: 2-3 semanas  
**Inicio**: Q3 2025

- [ ] API REST pública
- [ ] Webhooks de eventos
- [ ] Facturación electrónica (SAT)
- [ ] Delivery (Uber Eats, Rappi)
- [ ] Sistemas de contabilidad

---

### Fase 4: Analytics Avanzado 📊

**Prioridad**: Media  
**Estimación**: 3 semanas  
**Inicio**: Q3 2025

- [ ] ML para proyecciones mejoradas
- [ ] Análisis de rentabilidad
- [ ] Recomendaciones automáticas

---

### Fase 5: Mobile App 📱

**Prioridad**: Baja  
**Estimación**: 6-8 semanas  
**Inicio**: Q4 2025

- [ ] React Native (iOS/Android)
- [ ] Escaneo de códigos
- [ ] Órdenes desde mesa
- [ ] Modo offline

---

## 📱 NAVEGACIÓN DEL SIDEBAR - PROPUESTA

### Navegación Actual
```
🏠 Panel de Control
📋 Planner
📦 Insumos
🛒 Productos
📊 Ventas
📈 Proyecciones
---
👤 Cuenta
⚙️ Configuración
```

### Navegación Propuesta (Post-Implementación)
```
🏠 Panel de Control
💳 Punto de Venta (POS) ← NUEVO (Fase 2.5)
🍽️ Operación ← NUEVO (Fase 2)
📋 Planner
📦 Insumos
🛒 Productos
📊 Ventas/Reportes
📈 Proyecciones
🏢 Sucursales ← NUEVO (Fase 1, solo Plan Cadena)
---
👤 Cuenta
⚙️ Configuración
```

### Diferencia entre POS y Ventas

| Aspecto | 💳 Punto de Venta (POS) | 📊 Ventas/Reportes |
|---------|------------------------|-------------------|
| **Uso** | Durante el servicio | Después del servicio |
| **Frecuencia** | Todo el día, constante | Diario/semanal |
| **Usuario** | Cajero, mesero | Gerente, dueño |
| **Objetivo** | Cobrar, registrar | Analizar, reportar |
| **Interfaz** | Touch, rápida | Tablas, gráficos |
| **Datos** | Tiempo real | Históricos |

---

## 📅 CRONOGRAMA ACTUALIZADO

### Diciembre 2024
- ✅ MVP funcional
- 🔄 Configurar Stripe
- 🔄 Completar Cuenta y Configuración

### Q1 2025 (Enero - Marzo)
- 🚀 **Fase 1: Multi-Sucursal** (8-10 semanas)

### Q2 2025 (Abril - Junio)
- 🚀 **Fase 2: Operaciones/Mesas** (10-12 semanas)
- 🚀 **Fase 2.5: POS** (inicio)

### Q3 2025 (Julio - Septiembre)
- 🚀 **Fase 2.5: POS** (continuación)
- 🚀 **Fase 3: Integraciones**
- 🚀 **Fase 4: Analytics**

### Q4 2025 (Octubre - Diciembre)
- 🚀 **Fase 5: Mobile App** (inicio)

---

## 📊 RESUMEN DE COMPONENTES

| Categoría | Implementados | Pendientes |
|-----------|--------------|------------|
| **Páginas Dashboard** | 7 | 3 (POS, Operación, Sucursales) |
| **Componentes** | 47 | ~30 (POS, Operaciones, Multi-sucursal) |
| **Endpoints API** | 8 | ~10 (POS, Operaciones) |
| **Hooks** | 2 | ~5 (usePos, useBranches, useTables) |
| **Contextos** | 2 | ~2 (BranchContext, PosContext) |
| **Migraciones SQL** | 3 | ~5 (Branches, Tables, POS) |

---

## 🎯 MÉTRICAS DE ÉXITO

### MVP (Actual)
- ✅ Sistema de inventario funcional
- ✅ Gestión de productos y menús
- ✅ Registro de ventas
- ✅ Proyecciones con IA
- ⏳ Suscripciones activas

### Fase 1 (Multi-Sucursal)
- [ ] 80% usuarios Cadena con 2+ sucursales
- [ ] Cambio de sucursal < 1 segundo
- [ ] 0 errores de aislamiento de datos

### Fase 2 (Operaciones)
- [ ] 70% usuarios crean layout
- [ ] Creación de layout < 10 minutos
- [ ] 90% mejora en gestión de mesas

### Fase 2.5 (POS)
- [ ] Venta promedio < 30 segundos
- [ ] 95% ventas sin errores
- [ ] Diferencias de caja < 1%

---

**Última revisión**: Diciembre 2024  
**Próxima revisión**: Enero 2025  
**Versión del documento**: 2.0
