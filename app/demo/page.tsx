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
          <main className="container mx-auto px-3 md:px-6 py-4 md:py-6 ml-0 md:ml-20 lg:ml-72">
            {/* Header - Compact */}
            <div className="mb-4 md:mb-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>{t('dashboardDemo')}</h2>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Vista general de tu inventario
                  </p>
                </div>

                {/* Period Selector */}
                <div className="flex gap-2">
                  <Button
                    variant={planPeriod === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlanPeriod('week')}
                    className="neumorphic-hover text-xs md:text-sm"
                  >
                    📅 Semana
                  </Button>
                  <Button
                    variant={planPeriod === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlanPeriod('month')}
                    className="neumorphic-hover text-xs md:text-sm"
                  >
                    📆 Mes
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Grid - Compact & Responsive */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
              <Card
                className={`neumorphic border-0 cursor-pointer transition-all hover:scale-105 ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-4 pt-3 md:pt-4">
                  <CardDescription className="text-[10px] md:text-xs">{t('totalSupplies')}</CardDescription>
                  <CardTitle className="text-2xl md:text-3xl font-black" style={{ fontFamily: 'Satoshi, sans-serif' }}>{totalSupplies}</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
                  <p className="text-[10px] md:text-xs text-muted-foreground">Todos</p>
                </CardContent>
              </Card>

              <Card
                className={`neumorphic border-0 cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-red-500 ${statusFilter === 'critical' ? 'ring-2 ring-red-500' : ''}`}
                onClick={() => setStatusFilter('critical')}
              >
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-4 pt-3 md:pt-4">
                  <CardDescription className="text-[10px] md:text-xs">🔴 Crítico</CardDescription>
                  <CardTitle className="text-2xl md:text-3xl font-black text-red-600" style={{ fontFamily: 'Satoshi, sans-serif' }}>{criticalSupplies}</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
                  <p className="text-[10px] md:text-xs text-muted-foreground">0-30%</p>
                </CardContent>
              </Card>

              <Card
                className={`neumorphic border-0 cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-amber-500 ${statusFilter === 'low' ? 'ring-2 ring-amber-500' : ''}`}
                onClick={() => setStatusFilter('low')}
              >
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-4 pt-3 md:pt-4">
                  <CardDescription className="text-[10px] md:text-xs">🟡 Bajo</CardDescription>
                  <CardTitle className="text-2xl md:text-3xl font-black text-amber-600" style={{ fontFamily: 'Satoshi, sans-serif' }}>{lowSupplies}</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
                  <p className="text-[10px] md:text-xs text-muted-foreground">31-50%</p>
                </CardContent>
              </Card>

              <Card
                className={`neumorphic border-0 cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-green-500 ${statusFilter === 'ok' ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => setStatusFilter('ok')}
              >
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-4 pt-3 md:pt-4">
                  <CardDescription className="text-[10px] md:text-xs">🟢 Bien</CardDescription>
                  <CardTitle className="text-2xl md:text-3xl font-black text-green-600" style={{ fontFamily: 'Satoshi, sans-serif' }}>{totalSupplies - criticalSupplies - lowSupplies}</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
                  <p className="text-[10px] md:text-xs text-muted-foreground">51-100%</p>
                </CardContent>
              </Card>
            </div>

            {/* Info Text - Compact */}
            <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs md:text-sm text-muted-foreground">
                💡 <strong>Aquí mostramos los insumos necesarios</strong> según el filtro seleccionado.
                Para ver y editar el inventario completo, ve a la pestaña{' '}
                <Link href="/demo/insumos" className="text-primary hover:underline font-medium">
                  Insumos
                </Link>.
              </p>
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
                        {supplies.filter(s => s.status === statusFilter).map(supply => {
                          const referenceQty = supply.optimal_quantity && supply.optimal_quantity > 0
                            ? supply.optimal_quantity
                            : supply.min_threshold;
                          const percentage = referenceQty > 0
                            ? Math.min((supply.current_quantity / referenceQty) * 100, 100)
                            : 100;

                          // Determine color based on status
                          const getColor = () => {
                            if (percentage <= 30) return '#ef4444'; // red-500
                            if (percentage <= 50) return '#f59e0b'; // amber-500
                            return '#22c55e'; // green-500
                          };

                          return (
                            <div key={supply.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                              {/* Half Circle Indicator */}
                              <div className="relative w-12 h-6 flex items-end justify-center">
                                <svg width="48" height="24" viewBox="0 0 48 24" className="overflow-visible">
                                  {/* Background half circle */}
                                  <path
                                    d="M 4 24 A 20 20 0 0 1 44 24"
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="4"
                                  />
                                  {/* Filled half circle based on percentage */}
                                  <path
                                    d="M 4 24 A 20 20 0 0 1 44 24"
                                    fill="none"
                                    stroke={getColor()}
                                    strokeWidth="4"
                                    strokeDasharray={`${(percentage / 100) * 62.83} 62.83`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span className="absolute text-[10px] font-bold" style={{ bottom: '-2px', color: getColor() }}>
                                  {Math.round(percentage)}%
                                </span>
                              </div>

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
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </PeriodProvider>
  )
}
