# Flowstock - Project State Documentation

**Last Updated:** November 15, 2025  
**Status:** Development - Basic functionality tested  
**Version:** 0.1.0

---

## 📋 Project Overview

**BarFlow** is an intelligent inventory management SaaS for bars and restaurants with AI-powered consumption projections. Built with Next.js 16 and Supabase, it features a modern neumorphic design and comprehensive inventory tracking.

---

## 🛠 Technology Stack

### Core Framework
- **Next.js:** 16.0.3 (App Router with Turbopack)
- **React:** 19.2.0
- **TypeScript:** 5.x
- **Node.js:** Compatible with latest LTS

### Backend & Database
- **Supabase:** PostgreSQL database with Row Level Security
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime subscriptions

### UI & Styling
- **TailwindCSS:** 4.1.9 (latest)
- **Radix UI:** Complete component library
- **shadcn/ui:** Pre-built accessible components
- **Design System:** Neumorphic design with OKLCH colors
- **Icons:** Lucide React
- **Fonts:** Geist & Geist Mono (Google Fonts)

### Forms & Validation
- **React Hook Form:** 7.60.0
- **Zod:** 3.25.76 (schema validation)
- **@hookform/resolvers:** 3.10.0

### Data Visualization
- **Recharts:** Latest (for charts and analytics)
- **date-fns:** Latest (date manipulation)

### State Management
- **SWR:** Latest (data fetching and caching)

---

## 📁 Project Structure

```
bar-inventory-saa-s/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── stats/route.ts        # Dashboard statistics endpoint
│   │   └── supplies/
│   │       └── urgent/route.ts   # Low stock alerts endpoint
│   ├── auth/                     # Authentication pages
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/page.tsx
│   ├── dashboard/                # Protected dashboard (requires auth)
│   │   ├── page.tsx              # Main dashboard
│   │   ├── insumos/              # Supplies management
│   │   ├── productos/            # Products/menu management
│   │   ├── ventas/               # Sales tracking
│   │   ├── proyecciones/         # AI projections
│   │   ├── configuracion/        # Settings
│   │   └── cuenta/               # Account management
│   ├── demo/                     # Demo pages (no auth)
│   │   ├── page.tsx              # Demo dashboard
│   │   ├── insumos/
│   │   ├── productos/
│   │   ├── ventas/
│   │   └── proyecciones/
│   ├── layout.tsx                # Root layout with fonts
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles + neumorphic design
├── components/                   # React components (35 total)
│   ├── ui/                       # shadcn/ui base components
│   ├── dashboard-layout.tsx      # Dashboard wrapper
│   ├── dashboard-nav.tsx         # Navigation component
│   ├── sidebar-nav.tsx           # Sidebar navigation
│   ├── stats-overview.tsx        # Statistics cards
│   ├── supplies-table.tsx        # Supplies data table
│   ├── products-table.tsx        # Products data table
│   ├── sales-table.tsx           # Sales history table
│   ├── sales-chart.tsx           # Sales visualization
│   ├── projection-view.tsx       # AI projections display
│   ├── urgent-supplies-alert.tsx # Low stock alerts
│   ├── add-supply-dialog.tsx     # Add supply modal
│   ├── edit-supply-dialog.tsx    # Edit supply modal
│   ├── delete-supply-dialog.tsx  # Delete confirmation
│   ├── receive-supply-dialog.tsx # Receive inventory modal
│   ├── add-product-dialog.tsx    # Add product modal
│   ├── edit-product-dialog.tsx   # Edit product modal
│   ├── delete-product-dialog.tsx # Delete product confirmation
│   ├── view-recipe-dialog.tsx    # View product recipe
│   ├── record-sale-dialog.tsx    # Record sale modal
│   ├── sales-stats.tsx           # Sales statistics
│   └── generate-projections-button.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Client-side Supabase client
│   │   ├── server.ts             # Server-side Supabase client
│   │   └── middleware.ts         # Auth middleware
│   └── utils.ts                  # Utility functions (cn)
├── scripts/                      # Database setup scripts
│   ├── 001_create_schema.sql    # Database schema
│   ├── 002_enable_rls.sql       # Row Level Security
│   └── 003_create_triggers.sql  # Database triggers
├── public/                       # Static assets
├── middleware.ts                 # Next.js middleware
├── components.json               # shadcn/ui config
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript config
├── next.config.mjs               # Next.js config
├── package.json                  # Dependencies
└── .env.local                    # Environment variables (not in git)
```

---

## 🗄 Database Schema

### Tables

#### `establishments`
- Bar/restaurant information
- Links to auth.users
- Fields: id, user_id, name, address, phone, timestamps

#### `supplies`
- Inventory items (ingredients, beverages, etc.)
- Fields: id, establishment_id, name, category, unit, current_quantity, min_threshold, cost_per_unit, supplier, last_received_date, timestamps

#### `supply_movements`
- Transaction log for inventory changes
- Types: received, consumed, adjusted, expired
- Fields: id, supply_id, movement_type, quantity, cost, notes, created_at

#### `products`
- Menu items (cocktails, drinks, etc.)
- Fields: id, establishment_id, name, category, price, description, is_active, timestamps

#### `product_ingredients`
- Recipe definitions (which supplies make up each product)
- Fields: id, product_id, supply_id, quantity_needed, created_at

#### `sales`
- Sales transactions
- Automatically deducts from inventory via triggers
- Fields: id, establishment_id, product_id, quantity, total_price, sale_date, created_at

#### `projections`
- AI-generated consumption forecasts
- Fields: id, establishment_id, supply_id, projection_period (day/week/month), predicted_consumption, recommended_order, confidence_score, projection_date, created_at

---

## 🔌 API Endpoints

### `GET /api/stats`
Returns dashboard statistics:
- Total products count
- Low stock items count
- Today's sales total
- Monthly revenue

**Auth:** Required  
**Returns:** JSON with stats object

### `GET /api/supplies/urgent`
Returns supplies below minimum threshold with urgency levels:
- Critical: ≤2 days until depleted
- Warning: ≤5 days until depleted
- Low: >5 days until depleted

**Auth:** Required  
**Returns:** JSON array of urgent supplies with affected products

---

## 🎨 Design System

### Neumorphic Design
- Soft shadows for depth
- Subtle gradients
- OKLCH color space for perceptual uniformity
- Elegant, modern aesthetic

### Color Palette
- **Background:** Soft grey-blue (OKLCH)
- **Primary:** Deep blue (professional)
- **Secondary:** Warm amber (accent)
- **Success:** Green tones
- **Warning:** Amber tones
- **Destructive:** Red tones

### Typography
- **Primary:** Geist (sans-serif)
- **Monospace:** Geist Mono
- Font size scale follows Tailwind defaults

---

## 🚀 Features

### ✅ Implemented

1. **Landing Page**
   - Hero section with gradient text
   - Feature cards
   - Call-to-action buttons
   - Responsive design

2. **Demo Mode** (No authentication required)
   - Demo dashboard with mock stats
   - Browse all sections
   - Test UI/UX without setup

3. **Authentication System**
   - Login/Signup pages
   - Supabase Auth integration
   - Protected routes
   - Session management

4. **Inventory Management (Insumos)**
   - Add/Edit/Delete supplies
   - Track quantities and units
   - Set minimum thresholds
   - Categorize items
   - Record supplier information
   - Receive inventory shipments

5. **Product Management (Productos)**
   - Create menu items
   - Define recipes (ingredients)
   - Set pricing
   - Categorize products
   - Active/inactive status
   - View recipe details

6. **Sales Tracking (Ventas)**
   - Record sales transactions
   - Automatic inventory deduction
   - Sales history table
   - Daily/monthly statistics
   - Revenue tracking
   - Sales charts

7. **AI Projections (Proyecciones)**
   - Consumption forecasts
   - Daily/weekly/monthly predictions
   - Recommended order quantities
   - Confidence scores
   - Visual charts

8. **Dashboard**
   - Statistics overview
   - Urgent supplies alerts
   - Quick navigation cards
   - Real-time data

### 🔄 In Progress
- AI model integration for projections
- Advanced analytics
- Export functionality
- Multi-establishment support

### 📋 Planned
- Mobile app (React Native)
- Barcode scanning
- Supplier management portal
- Automated ordering
- Email notifications
- Advanced reporting
- Multi-language support

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local` in project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get credentials from:** https://app.supabase.com/project/_/settings/api

### Database Setup

1. Create a Supabase project
2. Run SQL scripts in order:
   - `scripts/001_create_schema.sql`
   - `scripts/002_enable_rls.sql`
   - `scripts/003_create_triggers.sql`

---

## 🏃‍♂️ Running the Project

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or pnpm
- Supabase account

### Installation

```bash
# Navigate to project
cd /Users/gibrann/Desktop/Barflow/bar-inventory-saa-s

# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Available Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 🧪 Testing

### Manual Testing Checklist

#### Landing Page
- [ ] Hero section displays correctly
- [ ] Feature cards are visible
- [ ] Navigation buttons work
- [ ] Responsive on mobile/tablet

#### Demo Mode
- [ ] Demo dashboard loads
- [ ] Mock statistics display
- [ ] All demo pages accessible
- [ ] No authentication required

#### Authentication (Requires Supabase)
- [ ] Login page works
- [ ] Signup creates new user
- [ ] Protected routes redirect to login
- [ ] Logout clears session

#### Inventory Management
- [ ] Add new supply
- [ ] Edit existing supply
- [ ] Delete supply
- [ ] Low stock alerts appear
- [ ] Receive inventory updates quantity

#### Product Management
- [ ] Create product with recipe
- [ ] Edit product details
- [ ] View recipe ingredients
- [ ] Delete product

#### Sales
- [ ] Record sale
- [ ] Inventory auto-deducts
- [ ] Sales appear in history
- [ ] Statistics update

---

## 🐛 Known Issues

### Fixed
- ✅ React hydration mismatch (font variables) - Fixed Nov 15, 2025
- ✅ Dependency conflict with vaul package - Fixed Nov 15, 2025

### Active
- ⚠️ Middleware deprecation warning (Next.js 16)
- ⚠️ ESLint config in next.config.mjs deprecated
- ⚠️ Multiple lockfiles detected (pnpm-lock.yaml and package-lock.json)

### Workarounds
- Using `--legacy-peer-deps` for npm install due to React 19 compatibility

---

## 📊 Current Status

### Development Progress: ~60%

| Feature | Status | Progress |
|---------|--------|----------|
| Landing Page | ✅ Complete | 100% |
| Authentication | ✅ Complete | 100% |
| Database Schema | ✅ Complete | 100% |
| Inventory Management | ✅ Complete | 100% |
| Product Management | ✅ Complete | 100% |
| Sales Tracking | ✅ Complete | 100% |
| AI Projections (UI) | ✅ Complete | 100% |
| AI Projections (Backend) | 🔄 In Progress | 30% |
| Analytics Dashboard | 🔄 In Progress | 70% |
| Settings/Config | 📋 Planned | 0% |
| Multi-tenant | 📋 Planned | 0% |
| Mobile App | 📋 Planned | 0% |

---

## 🔐 Security

### Implemented
- Row Level Security (RLS) on all tables
- User authentication via Supabase
- Protected API routes
- Environment variable protection
- SQL injection prevention (parameterized queries)

### Best Practices
- Never commit `.env.local`
- Use Supabase RLS policies
- Validate all user inputs
- Sanitize data before display

---

## 📝 Development Notes

### Recent Changes (Nov 15, 2025)
1. Fixed React hydration mismatch in layout.tsx
2. Updated vaul package to v1.0.0 for React 19 compatibility
3. Installed dependencies with --legacy-peer-deps
4. Created comprehensive project documentation
5. Successfully ran development server
6. Tested basic functionality

### Next Steps
1. Implement actual AI projection algorithm
2. Add data export functionality
3. Create user settings page
4. Add email notifications
5. Implement barcode scanning
6. Add multi-establishment support
7. Create admin panel

---

## 🤝 Contributing

### Code Style
- Use TypeScript for all new files
- Follow existing component patterns
- Use shadcn/ui for new UI components
- Maintain neumorphic design consistency
- Write descriptive commit messages

### Component Guidelines
- Keep components small and focused
- Use React Server Components where possible
- Client components only when needed (interactivity)
- Proper error handling
- Loading states for async operations

---

## 📞 Support & Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)

### Project Links
- **Production:** https://barflow-686958505968.us-central1.run.app
- **GitHub:** https://github.com/gibrann/barmode

---

## 📄 License

Private project - All rights reserved

---

**Generated:** November 15, 2025  
**By:** AI Assistant (Cascade)  
**Project:** BarFlow - Bar Inventory SaaS
