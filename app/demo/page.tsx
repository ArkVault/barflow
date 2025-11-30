"use client";

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DemoSidebar } from "@/components/demo-sidebar";
import { PeriodProvider } from "@/contexts/period-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { calculateStockStatus } from "@/lib/stock-utils";

import dynamic from 'next/dynamic';

// Dynamic imports para optimizar carga inicial (Code Splitting)
const SalesChartSimple = dynamic(() => import("@/components/sales-chart-simple").then(mod => mod.SalesChartSimple), {
  loading: () => <div className="h-[160px] w-full animate-pulse bg-muted/20 rounded-lg" />,
  ssr: false
});
const InventoryProjectionChart = dynamic(() => import("@/components/inventory-projection-chart").then(mod => mod.InventoryProjectionChart), {
  loading: () => <div className="h-[160px] w-full animate-pulse bg-muted/20 rounded-lg" />,
  ssr: false
});
const NeonDonutChart = dynamic(() => import("@/components/neon-donut-chart").then(mod => mod.NeonDonutChart), {
  loading: () => <div className="h-[120px] w-full animate-pulse bg-muted/20 rounded-full" />,
  ssr: false
});

interface Supply {
  id: string;
  name: string;
  category: string;
  current_quantity: number;
  unit: string;
  min_threshold: number;
  optimal_quantity?: number;
  status: 'ok' | 'low' | 'critical';
}

interface TopProduct {
  product_name: string;
  total_sales: number;
}

export default function DemoPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { establishmentId, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [totalSupplies, setTotalSupplies] = useState(0);
  const [criticalSupplies, setCriticalSupplies] = useState(0);
  const [lowSupplies, setLowSupplies] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeMenuName, setActiveMenuName] = useState("Sin menú activo");
  const [activeMenuProductsCount, setActiveMenuProductsCount] = useState(0);
  const [menuName, setMenuName] = useState("Menú Actual");
  const [menuLastModified, setMenuLastModified] = useState("Nunca");
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [planPeriod, setPlanPeriod] = useState<'week' | 'month'>('week');
  const [salesPeriod, setSalesPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    if (!authLoading && establishmentId) {
      loadDashboardData();
    }
  }, [establishmentId, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Carga paralela de todos los datos para mayor velocidad
      const [suppliesRes, productsRes, activeMenuRes, settingsRes, salesRes] = await Promise.all([
        // 1. Insumos
        supabase
          .from('supplies')
          .select('*')
          .eq('establishment_id', establishmentId)
          .order('name', { ascending: true }),

        // 2. Productos (solo activos)
        supabase
          .from('products')
          .select('id, updated_at, menu_id')
          .eq('establishment_id', establishmentId)
          .eq('is_active', true)
          .order('updated_at', { ascending: false }),

        // 3. Menú Activo
        supabase
          .from('menus')
          .select('id, name')
          .eq('establishment_id', establishmentId)
          .eq('is_active', true)
          .single(),

        // 4. Configuración
        supabase
          .from('establishments')
          .select('menu_name')
          .eq('id', establishmentId)
          .single(),

        // 5. Ventas (última semana)
        supabase
          .from('sales')
          .select('product_id, quantity, products(name)')
          .eq('establishment_id', establishmentId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);
      if (suppliesRes.error) throw suppliesRes.error;
      const suppliesData = suppliesRes.data || [];

      if (suppliesData.length === 0) {
        router.push("/demo/planner");
        return;
      }

      let critical = 0;
      let low = 0;
      const suppliesWithStatus = suppliesData.map(supply => {
        const status = calculateStockStatus(supply);
        if (status === 'critical') critical++;
        else if (status === 'low') low++;
        return { ...supply, status };
      });

      setSupplies(suppliesWithStatus);
      setTotalSupplies(suppliesData.length);
      setCriticalSupplies(critical);
      setLowSupplies(low);

      // Procesar Productos
      const productsData = productsRes.data || [];
      setTotalProducts(productsData.length);

      // Procesar Menú Activo y sus productos
      if (activeMenuRes.data) {
        setActiveMenuName(activeMenuRes.data.name);
        // Contar productos del menú activo
        const activeMenuProducts = productsData.filter(p => p.menu_id === activeMenuRes.data.id);
        setActiveMenuProductsCount(activeMenuProducts.length);
      } else {
        setActiveMenuName("Sin menú activo");
        setActiveMenuProductsCount(0);
      }

      if (productsData.length > 0 && productsData[0].updated_at) {
        const lastModified = new Date(productsData[0].updated_at);
        const diffDays = Math.ceil(Math.abs(new Date().getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) setMenuLastModified("Hoy");
        else if (diffDays === 1) setMenuLastModified("Ayer");
        else if (diffDays < 7) setMenuLastModified(`Hace ${diffDays} días`);
        else if (diffDays < 30) setMenuLastModified(`Hace ${Math.floor(diffDays / 7)} sem`);
        else setMenuLastModified(`Hace ${Math.floor(diffDays / 30)} mes`);
      }

      // Procesar Configuración
      if (settingsRes.data?.menu_name) {
        setMenuName(settingsRes.data.menu_name);
      } else {
        const month = new Date().getMonth();
        const season = (month >= 2 && month <= 4) ? "Primavera" :
          (month >= 5 && month <= 7) ? "Verano" :
            (month >= 8 && month <= 10) ? "Otoño" : "Invierno";
        setMenuName(`${season} ${new Date().getFullYear()}`);
      }

      // Procesar Ventas
      const salesData = salesRes.data || [];
      const salesByProduct = salesData.reduce((acc: any, sale: any) => {
        if (sale.products?.name) {
          const name = sale.products.name;
          if (!acc[name]) acc[name] = { name, total: 0 };
          acc[name].total += sale.quantity || 1;
        }
        return acc;
      }, {});

      setTopProducts(Object.values(salesByProduct)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 5) as TopProduct[]);

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleReconfigure = async () => {
    if (confirm('¿Reconfigurar el plan eliminará todo tu inventario actual. ¿Continuar?')) {
      try {
        const supabase = createClient();

        // Delete all supplies for this establishment
        const { error } = await supabase
          .from('supplies')
          .delete()
          .eq('establishment_id', establishmentId);

        if (error) throw error;

        toast.success('Inventario reiniciado');
        router.push("/demo/planner");
      } catch (error: any) {
        toast.error('Error: ' + error.message);
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <PeriodProvider>
      <div className="min-h-svh bg-background">
        <DemoSidebar />

        <div className="min-h-svh flex flex-col">
          {/* Navigation */}
          <nav className="border-b neumorphic-inset bg-background/80 backdrop-blur">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <Link href="/">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  BarFlow Demo
                </h1>
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  className="neumorphic-hover border-0 rounded-full"
                  onClick={handleReconfigure}
                >
                  ⚙️ {t('reconfigurePlan')}
                </Button>
                <Button
                  className="neumorphic-hover border-0 rounded-full"
                  onClick={() => signOut()}
                >
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </nav>

          {/* Dashboard Overview */}
          <div className="min-h-screen bg-background p-4 ml-0 md:ml-20 lg:ml-72">
            <div className="max-w-5xl mx-auto">
              {/* Header - Compact */}
              <div className="mb-2">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold mb-0.5" style={{ fontFamily: 'Satoshi, sans-serif' }}>{t('dashboardDemo')}</h2>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Vista general de tu negocio
                    </p>
                  </div>

                  {/* Period Selector */}
                  <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-sm w-fit">
                    <button
                      type="button"
                      onClick={() => setPlanPeriod("week")}
                      className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${planPeriod === "week"
                        ? "bg-background text-foreground shadow-sm font-medium"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      📅 Semana
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanPeriod("month")}
                      className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${planPeriod === "month"
                        ? "bg-background text-foreground shadow-sm font-medium"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      📆 Mes
                    </button>
                  </div>
                </div>
              </div>

              {/* Top Row: Inventario + Productos (2 columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                {/* 1. INVENTARIO - Half Donut Chart */}
                <Card className="neumorphic border-0 bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="pb-1 px-3 pt-2">
                    <CardTitle className="text-xs font-bold">Inventario</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-2 h-[190px] flex flex-col justify-between">
                    <div className="flex-1 flex items-center justify-center">
                      <NeonDonutChart
                        critical={criticalSupplies}
                        low={lowSupplies}
                        optimal={totalSupplies - criticalSupplies - lowSupplies}
                      />
                    </div>

                    <Link href="/demo/insumos" className="mt-auto pt-2">
                      <Button variant="ghost" size="sm" className="w-full text-[10px] h-6 hover:bg-primary/10 hover:text-primary">
                        Ver inventario completo →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* 2. PRODUCTOS - Large Number Display */}
                <Card className="neumorphic border-0 bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="pb-1 px-3 pt-2">
                    <CardTitle className="text-xs font-bold">Productos</CardTitle>
                    <CardDescription className="text-[10px]">Menú actual</CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pb-2 h-[190px] flex flex-col justify-between">
                    <div className="flex items-start justify-between w-full">
                      <div className="flex flex-col">
                        <p className="text-4xl font-black text-primary leading-none" style={{
                          fontFamily: 'Satoshi, sans-serif',
                          textShadow: '0 0 20px rgba(var(--primary-rgb), 0.5)'
                        }}>
                          {totalProducts}
                        </p>
                        <p className="text-[10px] text-muted-foreground">en menú</p>
                      </div>

                      <div className="text-right space-y-0.5">
                        <div className="text-[10px] text-muted-foreground">Menú Activo: <span className="font-medium text-foreground">{activeMenuName}</span></div>
                        <div className="text-[10px] text-muted-foreground">Productos: <span className="font-medium text-foreground">{activeMenuProductsCount}</span></div>
                        <div className="text-[10px] text-muted-foreground">Modificado: <span className="font-medium text-foreground">{menuLastModified}</span></div>
                      </div>
                    </div>

                    {/* Top 5 Selling Products - Clean List */}
                    {topProducts.length > 0 && (
                      <div className="w-full mt-2 flex-1 overflow-hidden">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">🔥 Top 5 Más Vendidos</p>
                        <div className="space-y-1">
                          {topProducts.slice(0, 5).map((product, index) => (
                            <div key={index} className="flex items-center justify-between text-[10px] border-b border-border/40 last:border-0 pb-0.5">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className={`font-bold w-3 ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                                  #{index + 1}
                                </span>
                                <span className="font-medium truncate">{product.product_name}</span>
                              </div>
                              <span className="text-muted-foreground whitespace-nowrap">{product.total_sales} u.</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Link href="/demo/productos" className="mt-auto pt-2">
                      <Button variant="ghost" size="sm" className="w-full text-[10px] h-6 hover:bg-primary/10 hover:text-primary">
                        Ver todos los productos →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Row: Ventas + Proyecciones (2 columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                {/* Ventas */}
                <SalesChartSimple
                  period={planPeriod === 'week' ? 'week' : 'month'}
                />

                {/* Proyecciones */}
                <InventoryProjectionChart
                  period={planPeriod}
                  highSeason={false}
                />
              </div>

              {/* Info Text */}
              <div className="p-2 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground">
                  <strong>Panel de Control</strong> - Resumen de tu negocio.
                  Para gestionar inventario, ve a{' '}
                  <Link href="/demo/insumos" className="text-primary hover:underline font-medium">
                    Insumos
                  </Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PeriodProvider>
  )
}
