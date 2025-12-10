# 📋 TASK MANAGER - BARMODE

**Sistema de gestión de tareas para desarrollo**  
**Última actualización**: Diciembre 2024

---

## 🎯 SPRINT ACTUAL - Diciembre 2024

### ✅ Completadas

- [x] Sistema de autenticación con Supabase
- [x] Gestión de inventario (CRUD completo)
- [x] Gestión de productos y menús
- [x] Sistema de ventas
- [x] Proyecciones con IA
- [x] Dashboard con métricas
- [x] Row-Level Security (RLS)
- [x] Logos dinámicos por tema
- [x] Modal de upgrade de plan
- [x] Endpoints API de Stripe

### 🔄 En Progreso

- [ ] **Configuración de Stripe** (Prioridad: ALTA)
  - [ ] Crear 3 productos en Stripe Dashboard
  - [ ] Obtener Price IDs
  - [ ] Actualizar variables de entorno
  - [ ] Configurar webhooks
  - [ ] Probar flujo de upgrade completo
  - **Asignado a**: Pendiente
  - **Estimación**: 2 horas
  - **Bloqueadores**: Ninguno

---

## 🚀 BACKLOG - FEATURES PRINCIPALES

### EPIC 1: Sistema Multi-Sucursal (Plan Cadena) 🏢

**Objetivo**: Permitir a usuarios con Plan Cadena gestionar hasta 5 sucursales desde una sola cuenta

**Prioridad**: Alta  
**Estimación total**: 8-10 semanas  
**Dependencias**: Configuración de Stripe completada

---

#### User Story 1.1: Crear y Gestionar Sucursales

**Como** usuario con Plan Cadena  
**Quiero** poder crear y gestionar múltiples sucursales  
**Para** organizar mi negocio de manera centralizada

**Criterios de aceptación**:
- [ ] Puedo crear hasta 5 sucursales
- [ ] Cada sucursal tiene nombre, dirección, teléfono
- [ ] Puedo editar información de sucursales
- [ ] Puedo activar/desactivar sucursales
- [ ] Si tengo Plan Bar, solo puedo crear 1 sucursal
- [ ] Al intentar crear sucursal adicional con Plan Bar, veo modal de upgrade

**Tareas técnicas**:
- [ ] Crear migración `add_branches_table.sql`
  - Tabla: branches (id, name, address, phone, establishment_id, is_active)
  - Políticas RLS para branches
- [ ] Crear componente `app/dashboard/sucursales/page.tsx`
  - Lista de sucursales
  - Botón "Nueva Sucursal"
  - Cards con info de cada sucursal
- [ ] Crear componente `components/add-branch-dialog.tsx`
  - Form para crear sucursal
  - Validación de límite según plan
  - Integración con Supabase
- [ ] Crear hook `hooks/use-branches.ts`
  - Fetch branches
  - Create branch
  - Update branch
  - Delete branch
- [ ] Crear función de validación de límite
  - Verificar plan actual
  - Contar sucursales existentes
  - Retornar true/false

**Estimación**: 1 semana  
**Prioridad**: P0 (Crítica)

---

#### User Story 1.2: Selector de Sucursal

**Como** usuario con múltiples sucursales  
**Quiero** poder cambiar fácilmente entre sucursales  
**Para** ver datos específicos de cada una

**Criterios de aceptación**:
- [ ] Veo un selector de sucursal en la navbar
- [ ] El selector muestra la sucursal activa actual
- [ ] Puedo cambiar de sucursal con un click
- [ ] Al cambiar de sucursal, todos los datos se filtran automáticamente
- [ ] La sucursal seleccionada persiste en la sesión

**Tareas técnicas**:
- [ ] Crear componente `components/branch-selector.tsx`
  - Dropdown con lista de sucursales
  - Indicador de sucursal activa
  - Icono de sucursal
- [ ] Crear contexto `contexts/branch-context.tsx`
  - Estado global de sucursal activa
  - Función para cambiar sucursal
  - Persistir en localStorage
- [ ] Integrar selector en `components/dashboard-nav.tsx`
- [ ] Actualizar todas las queries para filtrar por branch_id
  - Insumos
  - Productos
  - Ventas
  - Menús

**Estimación**: 3 días  
**Prioridad**: P0 (Crítica)

---

#### User Story 1.3: Dashboard Consolidado

**Como** usuario con múltiples sucursales  
**Quiero** ver métricas agregadas de todas mis sucursales  
**Para** tener una vista general de mi negocio

**Criterios de aceptación**:
- [ ] Veo ventas totales de todas las sucursales
- [ ] Veo inventario total agregado
- [ ] Veo gráficos comparativos entre sucursales
- [ ] Puedo filtrar por sucursal específica
- [ ] Puedo ver top productos por sucursal

**Tareas técnicas**:
- [ ] Crear página `app/dashboard/consolidado/page.tsx`
- [ ] Crear componente `components/consolidated-metrics.tsx`
  - Cards con métricas agregadas
  - Queries que suman datos de todas las sucursales
- [ ] Crear componente `components/branch-comparison-chart.tsx`
  - Gráfico de barras comparando sucursales
  - Usar Chart.js o Recharts
- [ ] Crear queries agregadas en Supabase
  - SUM de ventas por sucursal
  - COUNT de productos por sucursal
  - AVG de métricas

**Estimación**: 1 semana  
**Prioridad**: P1 (Alta)

---

#### User Story 1.4: Transferencias de Inventario

**Como** usuario con múltiples sucursales  
**Quiero** transferir insumos entre sucursales  
**Para** optimizar mi inventario

**Criterios de aceptación**:
- [ ] Puedo crear una transferencia de insumos
- [ ] Selecciono sucursal origen y destino
- [ ] Selecciono insumos y cantidades
- [ ] La transferencia resta del origen y suma al destino
- [ ] Veo historial de transferencias
- [ ] Puedo cancelar transferencias pendientes

**Tareas técnicas**:
- [ ] Crear tabla `transfers`
  - from_branch_id, to_branch_id, supply_id, quantity, status, created_at
- [ ] Crear página `app/dashboard/transferencias/page.tsx`
- [ ] Crear componente `components/transfer-dialog.tsx`
  - Form para crear transferencia
  - Selección de sucursales
  - Selección de insumos
- [ ] Crear endpoint `app/api/transfers/route.ts`
  - POST: Crear transferencia
  - GET: Listar transferencias
  - PATCH: Aprobar/rechazar transferencia
- [ ] Implementar lógica de actualización de stock
  - Restar de origen
  - Sumar a destino
  - Transacción atómica

**Estimación**: 1.5 semanas  
**Prioridad**: P2 (Media)

---

### EPIC 2: Sistema de Operaciones (Gestión de Mesas) 🍽️

**Objetivo**: Permitir a usuarios diseñar el layout de su local y gestionar mesas en tiempo real

**Prioridad**: Media  
**Estimación total**: 10-12 semanas  
**Dependencias**: Sistema multi-sucursal completado

---

#### User Story 2.1: Editor Visual de Layout

**Como** dueño de bar  
**Quiero** diseñar visualmente el layout de mi local  
**Para** organizar mesas y secciones

**Criterios de aceptación**:
- [ ] Veo un canvas en blanco para diseñar
- [ ] Puedo crear secciones con nombre y color
- [ ] Puedo redimensionar y mover secciones
- [ ] Puedo crear mesas dentro de secciones
- [ ] Puedo elegir forma de mesa (circular, cuadrada, rectangular)
- [ ] Puedo arrastrar mesas para posicionarlas
- [ ] Puedo agregar lugares en barra
- [ ] Puedo guardar el layout
- [ ] El layout se carga al volver a la página

**Tareas técnicas**:
- [ ] Crear migraciones para tablas de operaciones
  - `sections` (id, name, branch_id, position_x, position_y, width, height, color)
  - `tables` (id, section_id, name, capacity, position_x, position_y, shape, status)
  - `bar_seats` (id, section_id, name, position, status)
- [ ] Investigar y seleccionar librería de canvas
  - Opciones: react-konva, fabric.js, konva
  - Criterios: Performance, facilidad de uso, documentación
- [ ] Crear página `app/dashboard/operacion/page.tsx`
  - Modo edición vs modo operación
  - Toolbar con herramientas
- [ ] Crear componente `components/operations/canvas-editor.tsx`
  - Canvas interactivo
  - Zoom in/out
  - Grid de alineación
- [ ] Crear componente `components/operations/section-tool.tsx`
  - Crear sección
  - Editar propiedades
  - Eliminar sección
- [ ] Crear componente `components/operations/table-tool.tsx`
  - Crear mesa
  - Seleccionar forma
  - Editar capacidad
  - Eliminar mesa
- [ ] Crear componente `components/operations/bar-seat-tool.tsx`
  - Crear lugar en barra
  - Numeración automática
- [ ] Implementar persistencia
  - Guardar layout en Supabase
  - Cargar layout al iniciar
  - Auto-save cada X segundos

**Estimación**: 3-4 semanas  
**Prioridad**: P1 (Alta)

---

#### User Story 2.2: Gestión de Mesas en Tiempo Real

**Como** mesero  
**Quiero** ver el estado de las mesas en tiempo real  
**Para** saber cuáles están disponibles

**Criterios de aceptación**:
- [ ] Veo el layout con colores según estado
  - Verde: Disponible
  - Rojo: Ocupada
  - Amarillo: Reservada
  - Gris: En limpieza
- [ ] Puedo asignar una mesa a clientes
- [ ] Puedo tomar orden desde la mesa
- [ ] Puedo cerrar la cuenta y liberar la mesa
- [ ] Los cambios se reflejan en tiempo real para todos los usuarios

**Tareas técnicas**:
- [ ] Crear tabla `table_orders`
  - table_id, products, status, total, customer_count, started_at
- [ ] Crear página `app/dashboard/operacion/vista-mesas/page.tsx`
  - Canvas en modo solo lectura
  - Click en mesa para ver detalles
- [ ] Crear componente `components/operations/table-status.tsx`
  - Mostrar estado visual de mesa
  - Click para abrir menú de acciones
- [ ] Crear componente `components/operations/assign-table-dialog.tsx`
  - Form para asignar mesa
  - Número de personas
  - Nombre del cliente (opcional)
- [ ] Crear componente `components/operations/table-order-dialog.tsx`
  - Menú de productos
  - Agregar items a orden
  - Ver total
- [ ] Implementar Supabase Realtime
  - Suscribirse a cambios en `tables`
  - Actualizar UI en tiempo real
- [ ] Crear endpoint `app/api/table-orders/route.ts`
  - POST: Crear orden
  - PATCH: Actualizar orden
  - DELETE: Cerrar cuenta

**Estimación**: 2-3 semanas  
**Prioridad**: P1 (Alta)

---

#### User Story 2.3: Reportes de Operaciones

**Como** gerente  
**Quiero** ver reportes de ocupación de mesas  
**Para** optimizar mi operación

**Criterios de aceptación**:
- [ ] Veo tasa de ocupación por mesa
- [ ] Veo tiempo promedio de ocupación
- [ ] Veo ingresos por mesa
- [ ] Veo comparativa entre secciones
- [ ] Puedo filtrar por fecha y turno

**Tareas técnicas**:
- [ ] Crear página `app/dashboard/reportes/operaciones/page.tsx`
- [ ] Crear componente `components/operations/occupancy-chart.tsx`
  - Gráfico de ocupación por hora
- [ ] Crear queries de analytics
  - Calcular tasa de ocupación
  - Calcular tiempo promedio
  - Calcular ingresos por mesa
- [ ] Crear filtros de fecha y turno

**Estimación**: 1 semana  
**Prioridad**: P2 (Media)

---

## 📊 PRIORIZACIÓN DE TAREAS

### Matriz de Prioridad (Eisenhower)

**Urgente e Importante (Hacer Ahora)**:
1. Configurar Stripe
2. Crear tabla de sucursales
3. Implementar selector de sucursal

**Importante pero No Urgente (Planificar)**:
4. Dashboard consolidado
5. Editor visual de layout
6. Gestión de mesas en tiempo real

**Urgente pero No Importante (Delegar/Automatizar)**:
7. Documentación
8. Tests E2E

**Ni Urgente Ni Importante (Eliminar/Posponer)**:
9. Reportes avanzados
10. Mobile app

---

## 🎯 OBJETIVOS POR SPRINT

### Sprint 1 (Diciembre 2024) - 2 semanas
- [x] Finalizar RLS
- [ ] Configurar Stripe completamente
- [ ] Probar flujo de upgrade

### Sprint 2 (Enero 2025) - 2 semanas
- [ ] Crear infraestructura de sucursales
- [ ] Implementar selector de sucursal
- [ ] Migrar datos existentes

### Sprint 3 (Enero-Febrero 2025) - 2 semanas
- [ ] Dashboard consolidado
- [ ] Transferencias de inventario
- [ ] Testing multi-sucursal

### Sprint 4 (Febrero 2025) - 2 semanas
- [ ] Investigación de canvas library
- [ ] Diseño UX de editor de layout
- [ ] Crear tablas de operaciones

### Sprint 5-7 (Marzo-Abril 2025) - 6 semanas
- [ ] Implementar editor visual
- [ ] Gestión de mesas en tiempo real
- [ ] Reportes de operaciones

---

## 🐛 BUGS Y ISSUES

### Bugs Conocidos
- Ninguno reportado actualmente

### Technical Debt
- [ ] Optimizar queries de dashboard (usar índices)
- [ ] Implementar cache con React Query
- [ ] Refactorizar componentes grandes (>300 líneas)
- [ ] Agregar tests unitarios

---

## 📝 NOTAS Y DECISIONES

### Decisiones de Arquitectura

**Multi-Sucursal**:
- ✅ Usar `branch_id` en lugar de duplicar tablas
- ✅ Contexto global para sucursal activa
- ✅ Filtrado automático en todas las queries

**Operaciones**:
- ⏳ Pendiente: Seleccionar librería de canvas
- ⏳ Pendiente: Definir estructura de datos para layout
- ⏳ Pendiente: Estrategia de sincronización en tiempo real

---

## 🔄 PROCESO DE DESARROLLO

### Definition of Done
- [ ] Código escrito y revisado
- [ ] Tests pasando
- [ ] Documentación actualizada
- [ ] PR aprobado
- [ ] Desplegado a staging
- [ ] QA aprobado
- [ ] Desplegado a producción

### Workflow
1. Crear branch desde `main`
2. Desarrollar feature
3. Crear PR
4. Code review
5. Merge a `main`
6. Deploy automático

---

**Última actualización**: Diciembre 2024  
**Próxima revisión**: Semanal (Lunes)
