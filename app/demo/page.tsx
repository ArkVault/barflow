"use client";

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DemoSidebar } from "@/components/demo-sidebar";
import { UrgentSuppliesAlertDemo } from "@/components/urgent-supplies-alert-demo";
import { StockTrafficLightDemo } from "@/components/stock-traffic-light-demo";
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
  const [planPeriod, setPlanPeriod] = useState<'week' | 'month'>('week');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'low' | 'ok'>('all');

  useEffect(() => {
    if (!authLoading && establishmentId) {
      loadDashboardData();
    }
  }, [establishmentId, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('supplies')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('name', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // No supplies yet, redirect to planner
        router.push("/demo/planner");
        return;
      }

      // Calculate status for each supply and count by status
      let critical = 0;
      let low = 0;

      const suppliesWithStatus = data.map(supply => {
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
      setTotalSupplies(data.length);
      setCriticalSupplies(critical);
      setLowSupplies(low);

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
          <main className="container mx-auto px-6 py-8 ml-0 md:ml-20 lg:ml-72">
            <div className="mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>{t('dashboardDemo')}</h2>
                  <p className="text-muted-foreground">
                    Vista general de tu inventario y operaciones
                  </p>
                </div>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Plan: {planPeriod === 'week' ? `📅 ${t('week')}` : `📆 ${t('month')}`}
                </Badge>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card
                className={`neumorphic border-0 cursor-pointer transition-all hover:scale-105 ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                <CardHeader className="pb-3">
                  <CardDescription>{t('totalSupplies')}</CardDescription>
                  <CardTitle className="text-5xl font-black" style={{ fontFamily: 'Satoshi, sans-serif' }}>{totalSupplies}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Todos los insumos</p>
                </CardContent>
              </Card>

              <Card
                className={`neumorphic border-0 cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-red-500 ${statusFilter === 'critical' ? 'ring-2 ring-red-500' : ''}`}
                onClick={() => setStatusFilter('critical')}
              >
                <CardHeader className="pb-3">
                  <CardDescription>Stock Crítico</CardDescription>
                  <CardTitle className="text-5xl font-black text-red-600" style={{ fontFamily: 'Satoshi, sans-serif' }}>{criticalSupplies}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">0-30% del óptimo</p>
                </CardContent>
              </Card>

              <Card
                className={`neumorphic border-0 cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-amber-500 ${statusFilter === 'low' ? 'ring-2 ring-amber-500' : ''}`}
                onClick={() => setStatusFilter('low')}
              >
                <CardHeader className="pb-3">
                  <CardDescription>Stock Bajo</CardDescription>
                  <CardTitle className="text-5xl font-black text-amber-600" style={{ fontFamily: 'Satoshi, sans-serif' }}>{lowSupplies}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">31-50% del óptimo</p>
                </CardContent>
              </Card>

              <Card
                className={`neumorphic border-0 cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-green-500 ${statusFilter === 'ok' ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => setStatusFilter('ok')}
              >
                <CardHeader className="pb-3">
                  <CardDescription>Stock OK</CardDescription>
                  <CardTitle className="text-5xl font-black text-green-600" style={{ fontFamily: 'Satoshi, sans-serif' }}>{totalSupplies - criticalSupplies - lowSupplies}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">51-100% del óptimo</p>
                </CardContent>
              </Card>
            </div>

            {/* Filtered Supplies List */}
            {statusFilter !== 'all' && (
              <div className="mb-8">
                <Card className="neumorphic border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Insumos necesarios
                      <Badge variant={statusFilter === 'critical' ? 'destructive' : statusFilter === 'low' ? 'default' : 'secondary'}>
                        {statusFilter === 'critical' ? 'Críticos' : statusFilter === 'low' ? 'Bajos' : 'OK'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {statusFilter === 'critical' && 'Requieren atención inmediata (0-30% del óptimo)'}
                      {statusFilter === 'low' && 'Necesitan reabastecimiento pronto (31-50% del óptimo)'}
                      {statusFilter === 'ok' && 'Stock en nivel saludable (51-100% del óptimo)'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {supplies.filter(s => s.status === statusFilter).length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No hay insumos en esta categoría
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {supplies.filter(s => s.status === statusFilter).map(supply => (
                          <div key={supply.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                            <div className="flex-1">
                              <p className="font-medium">{supply.name}</p>
                              <p className="text-sm text-muted-foreground">{supply.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{supply.current_quantity} {supply.unit}</p>
                              <p className="text-xs text-muted-foreground">
                                Óptimo: {supply.optimal_quantity || supply.min_threshold} {supply.unit}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Period Selector and Traffic Light */}
            <div className="mb-6">
              <StockTrafficLightDemo />
            </div>

            <div className="max-w-4xl">
              <UrgentSuppliesAlertDemo />
            </div>
          </main>
        </div>
      </div>
    </PeriodProvider>
  )
}
