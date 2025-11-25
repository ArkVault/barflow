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

import { AnimatedSalesChart } from "@/components/animated-sales-chart";

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

      // Load supplies
      const { data: suppliesData, error: suppliesError } = await supabase
        .from('supplies')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('name', { ascending: true });

      if (suppliesError) throw suppliesError;

      if (!suppliesData || suppliesData.length === 0) {
        router.push("/demo/planner");
        return;
      }

      // Calculate status for each supply and count by status
      let critical = 0;
      let low = 0;

      const suppliesWithStatus = suppliesData.map(supply => {
        const status = calculateStockStatus(supply);
        if (status === 'critical') critical++;
        else if (status === 'low') low++;

        return {
          id: supply.id,
          name: supply.name,
          category: supply.category || 'Otros',
          current_quantity: supply.current_quantity,
          unit: supply.unit,
          min_threshold: supply.min_threshold,
          optimal_quantity: supply.optimal_quantity,
          status
        };
      });

      setSupplies(suppliesWithStatus);
      setTotalSupplies(suppliesData.length);
      setCriticalSupplies(critical);
      setLowSupplies(low);

      // Load products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('establishment_id', establishmentId);

      if (!productsError) {
        setTotalProducts(productsCount || 0);
      }

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast.error('Error al cargar datos: ' + error.message);
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
                  variant="outline"
                  className="neumorphic-hover border-0"
                  onClick={handleReconfigure}
                >
                  ⚙️ {t('reconfigurePlan')}
                </Button>
                <Button
                  variant="outline"
                  className="neumorphic-hover border-0"
                  onClick={() => signOut()}
                >
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </nav>

          {/* Dashboard Overview */}
          <main className="container mx-auto px-3 md:px-4 py-3 md:py-4 ml-0 md:ml-20 lg:ml-72 max-h-screen overflow-hidden">
            {/* Header - Balanced */}
            <div className="mb-3 md:mb-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>{t('dashboardDemo')}</h2>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Vista general de tu negocio
                  </p>
                </div>

                {/* Period Selector */}
                <div className="flex gap-2">
                  <Button
                    variant={planPeriod === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlanPeriod('week')}
                    className="text-xs h-7 px-3"
                  >
                    📅 Semana
                  </Button>
                  <Button
                    variant={planPeriod === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlanPeriod('month')}
                    className="text-xs h-7 px-3"
                  >
                    📆 Mes
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content Grid - Balanced Layout */}
            {/* Top Row: Insumos + Productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {/* 1. INSUMOS */}
              <Card className="neumorphic border-0">
                <CardHeader className="pb-2 px-3 md:px-4 pt-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base md:text-lg font-bold">📦 Insumos</CardTitle>
                    <CardDescription className="text-xs">
                      {planPeriod === 'week' ? 'Semana' : 'Mes'}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="px-3 md:px-4 pb-3 space-y-2">
                  {/* Period Toggle */}
                  <div className="flex gap-1">
                    <Button
                      variant={planPeriod === 'week' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPlanPeriod('week')}
                      className="text-xs flex-1 h-6"
                    >
                      📅
                    </Button>
                    <Button
                      variant={planPeriod === 'month' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPlanPeriod('month')}
                      className="text-xs flex-1 h-6"
                    >
                      📆
                    </Button>
                  </div>

                  {/* Summary Stats */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🔴</span>
                        <span className="text-xs font-medium">Críticos</span>
                      </div>
                      <span className="text-xl md:text-2xl font-black text-red-600" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        {criticalSupplies}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🟡</span>
                        <span className="text-xs font-medium">Bajos</span>
                      </div>
                      <span className="text-xl md:text-2xl font-black text-amber-600" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        {lowSupplies}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🟢</span>
                        <span className="text-xs font-medium">Óptimos</span>
                      </div>
                      <span className="text-xl md:text-2xl font-black text-green-600" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        {totalSupplies - criticalSupplies - lowSupplies}
                      </span>
                    </div>
                  </div>

                  {/* Link */}
                  <Link href="/demo/insumos">
                    <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-7">
                      Ver inventario →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* 2. PRODUCTOS */}
              <Card className="neumorphic border-0">
                <CardHeader className="pb-2 px-3 md:px-4 pt-3">
                  <CardTitle className="text-base md:text-lg font-bold">🍽️ Productos</CardTitle>
                  <CardDescription className="text-xs">
                    Menú actual
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 md:px-4 pb-3">
                  <div className="flex flex-col items-center justify-center py-4 md:py-6">
                    <p className="text-4xl md:text-5xl font-black text-primary mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      {totalProducts}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Productos en menú
                    </p>
                  </div>

                  <Link href="/demo/productos">
                    <Button variant="outline" size="sm" className="w-full text-xs h-7">
                      Ver productos →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row: Ventas (2/3 width, centered) */}
            <div className="mb-3 flex justify-center">
              <div className="w-full md:w-2/3">
                <AnimatedSalesChart
                  period={salesPeriod}
                  onPeriodChange={setSalesPeriod}
                />
              </div>
            </div>

            {/* Info Text */}
            <div className="p-2 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Panel de Control</strong> - Resumen de tu negocio.
                Para gestionar inventario, ve a{' '}
                <Link href="/demo/insumos" className="text-primary hover:underline font-medium">
                  Insumos
                </Link>.
              </p>
            </div>
          </main>
        </div>
      </div>
    </PeriodProvider>
  )
}
