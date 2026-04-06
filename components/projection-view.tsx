"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import { useLanguage } from "@/hooks/use-language";
import dynamic from 'next/dynamic';

// Dynamic chart imports for code splitting
const InventoryProjectionChart = dynamic(
  () => import("@/components/inventory-projection-chart").then(mod => mod.InventoryProjectionChart),
  { loading: () => <div className="h-[340px] w-full animate-pulse bg-muted/20 rounded-lg" />, ssr: false }
);
const SalesProjectionChart = dynamic(
  () => import("@/components/sales-projection-chart").then(mod => mod.SalesProjectionChart),
  { loading: () => <div className="h-[340px] w-full animate-pulse bg-muted/20 rounded-lg" />, ssr: false }
);

interface Supply {
  id: string;
  name: string;
  unit: string;
  current_quantity: number;
  min_threshold: number;
  category: string | null;
}

interface ProductIngredient {
  supply_id: string;
  quantity_needed: number;
}

interface Sale {
  id: string;
  quantity: number;
  sale_date: string;
  products: {
    product_ingredients: ProductIngredient[];
  };
}

interface ProjectionViewProps {
  establishmentId: string;
  supplies: Supply[];
  sales: Sale[];
}

interface Projection {
  supply: Supply;
  dailyConsumption: number;
  weeklyConsumption: number;
  monthlyConsumption: number;
  daysUntilEmpty: number;
  weeklyRecommendation: number;
  monthlyRecommendation: number;
  status: 'critical' | 'warning' | 'good' | 'excellent';
}

type PeriodKey = 'day' | 'week' | 'month';

// ─── Reusable status config ───
function getStatusConfig(status: string, language: string) {
  const es = language === 'es';
  switch (status) {
    case 'critical':
      return { icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: es ? 'Crítico' : 'Critical', variant: 'destructive' as const };
    case 'warning':
      return { icon: TrendingDown, color: 'text-warning', bgColor: 'bg-warning/10', label: es ? 'Atención' : 'Warning', variant: 'outline' as const };
    case 'good':
      return { icon: TrendingUp, color: 'text-secondary', bgColor: 'bg-secondary/10', label: es ? 'Bien' : 'Good', variant: 'secondary' as const };
    default:
      return { icon: CheckCircle2, color: 'text-chart-3', bgColor: 'bg-chart-3/10', label: es ? 'Excelente' : 'Excellent', variant: 'default' as const };
  }
}

// ─── Recent date range for projections (last 30 days only) ───
const RECENT_DAYS = 30;

export function ProjectionView({ supplies, sales }: ProjectionViewProps) {
  const { language } = useLanguage();
  const [period, setPeriod] = useState<PeriodKey>('week');
  const [highSeason, setHighSeason] = useState(false);

  const es = language === 'es';

  // ─── Memoized projections — only recalculate when data changes ───
  const projections = useMemo((): Projection[] => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000);

    // Filter sales to recent window only
    const recentSales = sales.filter(s => new Date(s.sale_date) >= cutoff);

    // Calculate the actual date range of recent sales
    const saleDates = recentSales.map(s => new Date(s.sale_date).getTime());
    const oldestSale = saleDates.length > 0 ? Math.min(...saleDates) : now.getTime();
    const daysOfData = Math.max(1, (now.getTime() - oldestSale) / (1000 * 60 * 60 * 24));

    const seasonMultiplier = highSeason ? 1.3 : 1.0;

    return supplies.map(supply => {
      const supplyConsumption = recentSales
        .filter(sale => sale.products?.product_ingredients?.some(ing => ing.supply_id === supply.id))
        .reduce((total, sale) => {
          const ingredient = sale.products.product_ingredients.find(ing => ing.supply_id === supply.id);
          return total + (ingredient ? ingredient.quantity_needed * sale.quantity : 0);
        }, 0);

      const dailyConsumption = (supplyConsumption / daysOfData) * seasonMultiplier;
      const weeklyConsumption = dailyConsumption * 7;
      const monthlyConsumption = dailyConsumption * 30;

      const daysUntilEmpty = dailyConsumption > 0
        ? supply.current_quantity / dailyConsumption
        : Infinity;

      const weeklyRecommendation = Math.max(0, weeklyConsumption - supply.current_quantity + supply.min_threshold);
      const monthlyRecommendation = Math.max(0, monthlyConsumption - supply.current_quantity + supply.min_threshold);

      let status: Projection['status'] = 'excellent';
      if (daysUntilEmpty < 3) status = 'critical';
      else if (daysUntilEmpty < 7) status = 'warning';
      else if (daysUntilEmpty < 14) status = 'good';

      return {
        supply, dailyConsumption, weeklyConsumption, monthlyConsumption,
        daysUntilEmpty, weeklyRecommendation, monthlyRecommendation, status,
      };
    }).sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty);
  }, [supplies, sales, highSeason]);

  const getStockPercentage = (current: number, min: number) => {
    const recommended = min * 2;
    return Math.min(100, (current / Math.max(recommended, 1)) * 100);
  };

  // ─── Period config for the unified card renderer ───
  const periodConfig: Record<PeriodKey, {
    consumptionKey: keyof Projection;
    recommendationKey: keyof Projection;
    consumptionLabel: string;
    recommendationLabel: string;
    durationLabel: (days: number) => string;
    headerTitle: string;
    headerDescription: string;
  }> = {
    day: {
      consumptionKey: 'dailyConsumption',
      recommendationKey: 'weeklyRecommendation',
      consumptionLabel: es ? 'Consumo diario:' : 'Daily consumption:',
      recommendationLabel: es ? 'Duración:' : 'Duration:',
      durationLabel: (days) => days === Infinity ? (es ? '∞ días' : '∞ days') : `${Math.floor(days)} ${es ? 'días' : 'days'}`,
      headerTitle: '',
      headerDescription: '',
    },
    week: {
      consumptionKey: 'weeklyConsumption',
      recommendationKey: 'weeklyRecommendation',
      consumptionLabel: es ? 'Consumo semanal:' : 'Weekly consumption:',
      recommendationLabel: es ? 'Recomendado:' : 'Recommended:',
      durationLabel: (val) => val > 0 ? `${val.toFixed(1)}` : (es ? 'Suficiente' : 'Sufficient'),
      headerTitle: es ? 'Recomendaciones de Compra Semanal' : 'Weekly Purchase Recommendations',
      headerDescription: es
        ? 'Cantidades sugeridas para mantener el inventario óptimo durante 7 días'
        : 'Suggested quantities to maintain optimal inventory for 7 days',
    },
    month: {
      consumptionKey: 'monthlyConsumption',
      recommendationKey: 'monthlyRecommendation',
      consumptionLabel: es ? 'Consumo mensual:' : 'Monthly consumption:',
      recommendationLabel: es ? 'Recomendado:' : 'Recommended:',
      durationLabel: (val) => val > 0 ? `${val.toFixed(1)}` : (es ? 'Suficiente' : 'Sufficient'),
      headerTitle: es ? 'Plan de Compras Mensual' : 'Monthly Purchase Plan',
      headerDescription: es
        ? 'Planificación de inventario para los próximos 30 días'
        : 'Inventory planning for the next 30 days',
    },
  };

  if (projections.length === 0) {
    return (
      <Card className="neumorphic border-0">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            {es ? 'No hay datos suficientes para generar proyecciones' : 'Not enough data to generate projections'}
          </p>
          <p className="text-sm text-muted-foreground">
            {es ? 'Registra algunos insumos y ventas para comenzar a ver predicciones' : 'Register some supplies and sales to start seeing predictions'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Unified card renderer for all 3 tabs ───
  function renderSupplyCards(periodKey: PeriodKey) {
    const config = periodConfig[periodKey];
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projections.map((proj) => {
          const statusConfig = getStatusConfig(proj.status, language);
          const Icon = statusConfig.icon;
          const stockPercentage = getStockPercentage(proj.supply.current_quantity, proj.supply.min_threshold);
          const consumptionVal = proj[config.consumptionKey] as number;
          const recommendationVal = proj[config.recommendationKey] as number;

          return (
            <Card key={proj.supply.id} className="neumorphic border-0">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-balance">{proj.supply.name}</CardTitle>
                    <CardDescription className="capitalize">
                      {proj.supply.category || (es ? 'Sin categoría' : 'No category')}
                    </CardDescription>
                  </div>
                  <Icon className={`h-5 w-5 ${statusConfig.color}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{es ? 'Stock actual:' : 'Current stock:'}</span>
                    <span className="font-medium">
                      {proj.supply.current_quantity.toFixed(1)} {proj.supply.unit}
                    </span>
                  </div>
                  <Progress value={stockPercentage} className="h-2" />
                </div>

                <div className="neumorphic-inset p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{config.consumptionLabel}</span>
                    <span className="font-medium">
                      {consumptionVal.toFixed(1)} {proj.supply.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{config.recommendationLabel}</span>
                    <span className="font-semibold text-primary">
                      {periodKey === 'day'
                        ? config.durationLabel(proj.daysUntilEmpty)
                        : recommendationVal > 0
                          ? `${recommendationVal.toFixed(1)} ${proj.supply.unit}`
                          : (es ? 'Suficiente' : 'Sufficient')
                      }
                    </span>
                  </div>
                </div>

                <Badge variant={statusConfig.variant} className="w-full justify-center">
                  {statusConfig.label}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // ─── Purchase recommendations panel (week/month only) ───
  function renderRecommendations(periodKey: 'week' | 'month') {
    const config = periodConfig[periodKey];
    const recKey = config.recommendationKey as 'weeklyRecommendation' | 'monthlyRecommendation';
    const consKey = config.consumptionKey as 'weeklyConsumption' | 'monthlyConsumption';
    const filtered = projections.filter(p => p[recKey] > 0);

    return (
      <Card className="neumorphic border-0 mb-6">
        <CardHeader>
          <CardTitle>{config.headerTitle}</CardTitle>
          <CardDescription>{config.headerDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filtered.length > 0 ? filtered.map((proj) => {
              const statusCfg = getStatusConfig(proj.status, language);
              return (
                <div key={proj.supply.id} className="neumorphic-inset p-4 rounded-lg flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant={statusCfg.variant} className="capitalize">{statusCfg.label}</Badge>
                      <span className="font-medium">{proj.supply.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {config.consumptionLabel} {proj[consKey].toFixed(1)} {proj.supply.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{proj[recKey].toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">{proj.supply.unit}</div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-chart-3" />
                <p className="font-medium">{es ? 'Inventario en buen estado' : 'Inventory in good shape'}</p>
                <p className="text-sm mt-1">
                  {periodKey === 'week'
                    ? (es ? 'No se necesitan compras esta semana' : 'No purchases needed this week')
                    : (es ? 'No se necesitan compras este mes' : 'No purchases needed this month')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Chart period mapping
  const chartPeriod: 'week' | 'month' = period === 'day' ? 'week' : period;

  return (
    <div className="space-y-6">
      {/* ─── Controls ─── */}
      <Card className="neumorphic border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Flame className={`w-5 h-5 ${highSeason ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <div className="flex flex-col">
                <Label htmlFor="high-season-toggle" className="text-sm font-medium cursor-pointer">
                  {es ? 'Temporada Alta' : 'High Season'}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {highSeason
                    ? (es ? 'Demanda aumentada (+30%)' : 'Increased demand (+30%)')
                    : (es ? 'Demanda normal' : 'Normal demand')}
                </span>
              </div>
              <Switch id="high-season-toggle" checked={highSeason} onCheckedChange={setHighSeason} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryProjectionChart period={chartPeriod} highSeason={highSeason} />
        <SalesProjectionChart period={chartPeriod} highSeason={highSeason} />
      </div>

      {/* ─── Tabs: Daily / Weekly / Monthly ─── */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodKey)} className="space-y-6">
        <TabsList className="neumorphic border-0">
          <TabsTrigger value="day">{es ? 'Diario' : 'Daily'}</TabsTrigger>
          <TabsTrigger value="week">{es ? 'Semanal' : 'Weekly'}</TabsTrigger>
          <TabsTrigger value="month">{es ? 'Mensual' : 'Monthly'}</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="space-y-4">
          {renderSupplyCards('day')}
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          {renderRecommendations('week')}
          {renderSupplyCards('week')}
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          {renderRecommendations('month')}
          {renderSupplyCards('month')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
