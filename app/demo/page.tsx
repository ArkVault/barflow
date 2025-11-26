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

import { NeonDonutChart } from "@/components/neon-donut-chart";
import { ProjectionsSummary } from "@/components/projections-summary";

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
          <main className="container mx-auto px-2 md:px-3 py-2 md:py-3 ml-0 md:ml-20 lg:ml-72 max-h-screen overflow-y-auto">
            {/* Header - Compact */}
            <div className="mb-2 md:mb-3">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-1 md:gap-2">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-0.5" style={{ fontFamily: 'Satoshi, sans-serif' }}>{t('dashboardDemo')}</h2>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Vista general de tu negocio
                  </p>
                </div>

                {/* Period Selector */}
                <div className="flex gap-1">
                  <Button
                    variant={planPeriod === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlanPeriod('week')}
                    className="text-[10px] h-6 px-2"
                  >
                    📅 Semana
                  </Button>
                  <Button
                    variant={planPeriod === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlanPeriod('month')}
                    className="text-[10px] h-6 px-2"
                  >
                    📆 Mes
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content Grid - Compact Layout */}
            {/* Top Row: Inventario + Productos (2 columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              {/* 1. INVENTARIO - Half Donut Chart */}
              <Card className="neumorphic border-0 bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-1 px-2 md:px-3 pt-2 md:pt-3">
                  <CardTitle className="text-xs md:text-sm font-bold">Inventario</CardTitle>
                </CardHeader>
                <CardContent className="px-2 md:px-3 pb-2 md:pb-3">
                  <NeonDonutChart
                    critical={criticalSupplies}
                    low={lowSupplies}
                    optimal={totalSupplies - criticalSupplies - lowSupplies}
                  />

                  <Link href="/demo/insumos">
                    <Button variant="outline" size="sm" className="w-full mt-2 text-[10px] h-6">
                      Ver inventario →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* 2. PRODUCTOS - Large Number Display */}
              <Card className="neumorphic border-0 bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-1 px-2 md:px-3 pt-2 md:pt-3">
                  <CardTitle className="text-xs md:text-sm font-bold">Productos</CardTitle>
                  <CardDescription className="text-[10px]">Menú actual</CardDescription>
                </CardHeader>
                <CardContent className="px-2 md:px-3 pb-2 md:pb-3">
                  <div className="flex flex-col items-center justify-center py-4 md:py-5">
                    <p className="text-4xl md:text-5xl font-black text-primary mb-1" style={{
                      fontFamily: 'Satoshi, sans-serif',
                      textShadow: '0 0 20px rgba(var(--primary-rgb), 0.5)'
                    }}>
                      {totalProducts}
                    </p>
                    <p className="text-[10px] text-muted-foreground">en menú</p>
                  </div>

                  <Link href="/demo/productos">
                    <Button variant="outline" size="sm" className="w-full text-[10px] h-6">
                      Ver productos →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row: Ventas + Proyecciones (2 columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              {/* Ventas */}
              <AnimatedSalesChart
                period={salesPeriod}
                onPeriodChange={setSalesPeriod}
              />

              {/* Proyecciones */}
              <ProjectionsSummary />
            </div>

            {/* Info Text - Compact */}
            <div className="p-1.5 rounded-lg bg-muted/50 border border-border">
              <p className="text-[9px] md:text-[10px] text-muted-foreground">
                <strong>Panel de Control</strong> - Resumen de tu negocio.
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
