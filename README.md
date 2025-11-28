# 🍹 BarFlow - Bar Inventory Management SaaS

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/arkvaults-projects-d96cac84/v0-bar-inventory-saa-s)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 📋 Descripción

**BarFlow** es una plataforma SaaS moderna y completa para la gestión inteligente de inventarios de bares y restaurantes. Ofrece control en tiempo real de insumos, gestión de productos, análisis de ventas y proyecciones predictivas basadas en IA.

### ✨ Características Principales

- 🎯 **Planificador de Inventario Inteligente** - Configuración inicial personalizada con selección de insumos
- 📊 **Dashboard Interactivo** - Vista general con métricas clave y alertas en tiempo real
- 🧪 **Gestión de Insumos Avanzada** - Control por unidades (botellas/items) con cálculos automáticos
- 📦 **Sistema de Contenido** - Tracking preciso por ml/g con resta automática en ventas
- 🏷️ **Categorías Inteligentes** - 7 categorías con defaults automáticos por tipo
- 🍸 **Gestión de Productos** - Menú digital con recetas, ingredientes y precios
- 📋 **Sistema de Menús** - Múltiples menús (temporadas, eventos) con historial
- 💰 **Registro de Ventas** - Seguimiento de transacciones con deducción automática de inventario
- 🔮 **Proyecciones Inteligentes** - Análisis predictivo con IA para optimizar compras
- 🌍 **Multiidioma** - Soporte completo para Español e Inglés con cambio en tiempo real
- 🌓 **Modo Oscuro** - Tema Monokai Ristretto con paleta de colores cálida
- 📱 **Diseño Responsivo** - Optimizado para desktop, tablet y móvil
- 🎨 **UI Neumórfica** - Interfaz moderna con efectos 3D suaves

---

## 🚀 Demo

Prueba la aplicación en modo demo sin necesidad de registro:

**[Ver Demo en Vivo](https://vercel.com/arkvaults-projects-d96cac84/v0-bar-inventory-saa-s)**

### Modo Demo
- ✅ Acceso inmediato sin autenticación
- ✅ Datos de ejemplo precargados
- ✅ Todas las funcionalidades disponibles
- ✅ Configuración de plan personalizado (semanal/mensual)

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript 5.0
- **Estilos:** Tailwind CSS 3.4
- **Componentes UI:** shadcn/ui + Radix UI
- **Iconos:** Lucide React
- **Animaciones:** Framer Motion (opcional)

### Backend
- **Base de Datos:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **Autenticación:** Supabase Auth
- **API:** Next.js API Routes

### Herramientas
- **Gestión de Estado:** React Hooks + Context API
- **Validación:** Zod
- **Internacionalización:** Sistema custom de traducciones
- **Deployment:** Vercel

---

## 📦 Instalación

### Prerrequisitos

- Node.js 18.x o superior
- npm o yarn
- Cuenta de Supabase (para producción)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/ArkVault/bar-inventory-saa-s.git
cd bar-inventory-saa-s
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Base de datos (opcional para desarrollo local)
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/barflow
```

4. **Ejecutar migraciones de base de datos**
```bash
npm run db:migrate
# o
npx prisma migrate dev
```

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
# o
yarn dev
```

6. **Abrir en el navegador**
```
http://localhost:3000
```

---

## 📁 Estructura del Proyecto

```
bar-inventory-saa-s/
├── app/                          # App Router de Next.js
│   ├── demo/                     # Páginas del modo demo
│   │   ├── page.tsx             # Dashboard demo
│   │   ├── planner/             # Planificador de inventario
│   │   ├── insumos/             # Gestión de insumos
│   │   ├── productos/           # Gestión de productos
│   │   ├── ventas/              # Registro de ventas
│   │   └── proyecciones/        # Proyecciones IA
│   ├── dashboard/               # Dashboard de producción
│   ├── api/                     # API Routes
│   ├── globals.css              # Estilos globales + variables CSS
│   └── layout.tsx               # Layout principal
│
├── components/                   # Componentes React
│   ├── ui/                      # Componentes base (shadcn/ui)
│   ├── demo-sidebar.tsx         # Sidebar del modo demo
│   ├── sidebar-nav.tsx          # Sidebar de producción
│   ├── theme-toggle.tsx         # Toggle de tema claro/oscuro
│   ├── language-toggle.tsx      # Toggle de idioma ES/EN
│   ├── inventory-planner.tsx    # Componente del planner
│   ├── urgent-supplies-alert.tsx # Alertas de stock
│   └── stock-traffic-light.tsx  # Semáforo de inventario
│
├── lib/                         # Utilidades y helpers
│   ├── translations.ts          # Sistema de traducciones
│   ├── default-supplies.ts      # Insumos por defecto
│   ├── planner-data.ts          # Lógica del planificador
│   ├── supabase.ts              # Cliente de Supabase
│   └── utils.ts                 # Funciones auxiliares
│
├── hooks/                       # Custom React Hooks
│   └── use-language.ts          # Hook de internacionalización
│
├── contexts/                    # React Contexts
│   └── period-context.tsx       # Context de periodo (día/semana/mes)
│
├── scripts/                     # Scripts de base de datos
│   ├── 001_create_tables.sql
│   ├── 002_create_functions.sql
│   └── 003_create_triggers.sql
│
├── public/                      # Archivos estáticos
└── prisma/                      # Esquema de Prisma
    └── schema.prisma
```

---

## 🎨 Características de UI/UX

### Diseño Neumórfico
- Efectos de sombra suaves que simulan profundidad
- Bordes redondeados y transiciones fluidas
- Hover states con elevación 3D

### Paleta de Colores (Modo Oscuro - Monokai Ristretto)
```css
--background: #2c2525        /* Marrón oscuro cálido */
--foreground: #f9f5d7        /* Beige claro */
--primary: #66d9ef           /* Cyan brillante */
--secondary: #fd971f         /* Naranja */
--accent: #a6e22e            /* Verde lima */
--destructive: #f92672       /* Rosa/rojo */
--warning: #e6db74           /* Amarillo */
```

### Componentes Interactivos
- Cards con hover effects
- Botones con estados visuales claros
- Tablas responsivas con ordenamiento
- Modales y diálogos animados
- Badges de estado con colores semánticos
- Gauges semicirculares para métricas

---

## 🌍 Sistema de Internacionalización

### Idiomas Soportados
- 🇪🇸 Español (por defecto)
- 🇬🇧 English

### Implementación

**Hook personalizado:**
```typescript
import { useLanguage } from '@/hooks/use-language';

function MyComponent() {
  const { t, language } = useLanguage();
  
  return <h1>{t('welcome')}</h1>;
}
```

**Diccionario de traducciones:**
```typescript
// lib/translations.ts
export const translations = {
  es: {
    welcome: "Bienvenido",
    dashboard: "Panel de Control"
  },
  en: {
    welcome: "Welcome",
    dashboard: "Dashboard"
  }
};
```

**Cambio de idioma:**
- Toggle en la esquina superior derecha del sidebar
- Cambio instantáneo sin recargar la página
- Persistencia en localStorage
- Actualización reactiva de todos los componentes

---

## 📊 Funcionalidades Principales

### 1. Planificador de Inventario
- Selección de insumos predefinidos por categorías
- Opción de agregar insumos personalizados
- Configuración de periodo (semanal/mensual)
- Guardado automático en localStorage

### 2. Dashboard Demo
- Métricas clave: Total de insumos, ventas, productos
- Alertas de stock crítico y bajo
- Semáforo visual de inventario
- Filtros por periodo (día/semana/mes)

### 3. Gestión de Insumos
- Tabla completa con todos los insumos
- Filtros por estado: Crítico, Bajo, Óptimo, Todos
- Indicadores visuales de stock
- Acciones: Editar, Recibir, Eliminar

### 4. Gestión de Productos
- Cards visuales de productos/bebidas
- Información de ingredientes y precios
- Estados: Activo/Inactivo
- Modal de recetas detalladas
- Diseñador de menú

### 5. Registro de Ventas
- Tabla de transacciones recientes
- Métricas: Ventas del día, transacciones, ticket promedio
- Registro manual de ventas
- Historial completo

### 6. Proyecciones Inteligentes
- Análisis predictivo por periodo
- Cálculo de días hasta agotamiento
- Recomendaciones de compra
- Alertas tempranas de reabastecimiento

---

## 🔐 Autenticación y Seguridad

### Modo Demo
- Acceso sin registro
- Datos en localStorage
- Sin persistencia en base de datos

### Modo Producción
- Autenticación con Supabase Auth
- Row Level Security (RLS)
- Sesiones seguras con JWT
- Protección de rutas con middleware

---

## 🗄️ Base de Datos

### Tablas Principales

**users**
- Información de usuarios
- Relación con establecimientos

**establishments**
- Datos del bar/restaurante
- Configuración del establecimiento

**supplies**
- Insumos del inventario
- Cantidad, unidad, mínimos

**products**
- Productos/bebidas del menú
- Recetas e ingredientes

**sales**
- Registro de ventas
- Relación con productos

**supply_movements**
- Historial de movimientos
- Entradas y salidas de stock

### Relaciones
```
users ──< establishments ──< supplies
                         ──< products ──< sales
                         ──< supply_movements
```

---

## 🚀 Deployment

### Vercel (Recomendado)

1. **Conectar repositorio**
```bash
vercel link
```

2. **Configurar variables de entorno**
- Agregar variables en el dashboard de Vercel
- Incluir credenciales de Supabase

3. **Deploy**
```bash
vercel --prod
```

### Variables de Entorno Requeridas
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
```

---

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm run test

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests e2e
npm run test:e2e
```

---

## 📝 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Iniciar servidor de producción
npm run lint         # Linter de código
npm run format       # Formatear código con Prettier
npm run db:migrate   # Ejecutar migraciones
npm run db:seed      # Poblar base de datos
npm run db:studio    # Abrir Prisma Studio
```

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución
- Seguir las convenciones de código existentes
- Escribir tests para nuevas funcionalidades
- Actualizar documentación cuando sea necesario
- Usar commits semánticos (feat, fix, docs, etc.)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👥 Autores

- **ArkVault Team** - *Desarrollo inicial* - [ArkVault](https://github.com/ArkVault)

---

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework React
- [Supabase](https://supabase.com/) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Vercel](https://vercel.com/) - Plataforma de deployment

---

## 📝 Changelog

### v1.0.0 (2025-11-28)

**🎉 Sistema de Inventario Avanzado**
- Tracking de contenido por unidad (750ml, 1L, etc.)
- Edición basada en unidades (botellas/items)
- Cálculos automáticos de cantidad total
- Resta automática de inventario en ventas
- Logs de auditoría completos

**🏷️ Categorías Inteligentes**
- 7 nuevas categorías de insumos
- Defaults automáticos por categoría
- Migración de categorías legacy

**📋 Sistema de Menús**
- Crear múltiples menús (temporadas, eventos)
- Un solo menú activo a la vez
- Historial de menús anteriores
- Activar/desactivar/eliminar menús

**🎨 Mejoras de UI**
- Tabla de insumos optimizada
- Planner con items deseleccionados por default
- Óptimo mostrado en unidades
- MenuManager component

---

## 🗺️ Roadmap

### v1.1 (Próximamente)
- [ ] Integración con APIs de proveedores
- [ ] Reportes en PDF exportables
- [ ] Notificaciones push
- [ ] App móvil nativa

### v1.2
- [ ] Análisis avanzado con gráficos
- [ ] Gestión de múltiples establecimientos
- [ ] Sistema de roles y permisos
- [ ] Integración con POS

### v2.0
- [ ] IA para recomendaciones de menú
- [ ] Predicción de demanda con ML
- [ ] Marketplace de proveedores
- [ ] API pública para integraciones

---

**Hecho con ❤️ por el equipo de ArkVault**
