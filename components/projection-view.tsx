"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

export function ProjectionView({ supplies, sales }: ProjectionViewProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const calculateProjections = (): Projection[] => {
    return supplies.map(supply => {
      const supplyConsumption = sales
        .filter(sale => {
          return sale.products?.product_ingredients?.some(
            ing => ing.supply_id === supply.id
          );
        })
        .reduce((total, sale) => {
          const ingredient = sale.products.product_ingredients.find(
            ing => ing.supply_id === supply.id
          );
          return total + (ingredient ? ingredient.quantity_needed * sale.quantity : 0);
        }, 0);

      const daysOfData = Math.max(
        1,
        (new Date().getTime() - new Date(sales[sales.length - 1]?.sale_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)
      );

      const dailyConsumption = supplyConsumption / Math.max(daysOfData, 1);
      const weeklyConsumption = dailyConsumption * 7;
      const monthlyConsumption = dailyConsumption * 30;

      const daysUntilEmpty = dailyConsumption > 0 
        ? supply.current_quantity / dailyConsumption 
        : Infinity;

      const weeklyRecommendation = Math.max(0, weeklyConsumption - supply.current_quantity + supply.min_threshold);
      const monthlyRecommendation = Math.max(0, monthlyConsumption - supply.current_quantity + supply.min_threshold);

      let status: 'critical' | 'warning' | 'good' | 'excellent' = 'excellent';
      if (daysUntilEmpty < 3) status = 'critical';
      else if (daysUntilEmpty < 7) status = 'warning';
      else if (daysUntilEmpty < 14) status = 'good';

      return {
        supply,
        dailyConsumption,
        weeklyConsumption,
        monthlyConsumption,
        daysUntilEmpty,
        weeklyRecommendation,
        monthlyRecommendation,
        status,
      };
    }).sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty);
  };

  const projections = calculateProjections();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'critical':
        return { 
          icon: AlertTriangle, 
          color: 'text-destructive', 
          bgColor: 'bg-destructive/10',
          label: 'Crítico',
          variant: 'destructive' as const
        };
      case 'warning':
        return { 
          icon: TrendingDown, 
          color: 'text-warning', 
          bgColor: 'bg-warning/10',
          label: 'Atención',
          variant: 'warning' as const
        };
      case 'good':
        return { 
          icon: TrendingUp, 
          color: 'text-secondary', 
          bgColor: 'bg-secondary/10',
          label: 'Bien',
          variant: 'secondary' as const
        };
      default:
        return { 
          icon: CheckCircle2, 
          color: 'text-chart-3', 
          bgColor: 'bg-chart-3/10',
          label: 'Excelente',
          variant: 'default' as const
        };
    }
  };

  const getStockPercentage = (current: number, min: number) => {
    const recommended = min * 2;
    return Math.min(100, (current / recommended) * 100);
  };

  if (projections.length === 0) {
    return (
      <Card className="neumorphic border-0">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">No hay datos suficientes para generar proyecciones</p>
          <p className="text-sm text-muted-foreground">
            Registra algunos insumos y ventas para comenzar a ver predicciones
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="space-y-6">
      <TabsList className="neumorphic border-0">
        <TabsTrigger value="day">Diario</TabsTrigger>
        <TabsTrigger value="week">Semanal</TabsTrigger>
        <TabsTrigger value="month">Mensual</TabsTrigger>
      </TabsList>

      <TabsContent value="day" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projections.map((proj) => {
            const config = getStatusConfig(proj.status);
            const Icon = config.icon;
            const stockPercentage = getStockPercentage(proj.supply.current_quantity, proj.supply.min_threshold);

            return (
              <Card key={proj.supply.id} className="neumorphic border-0">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-balance">{proj.supply.name}</CardTitle>
                      <CardDescription className="capitalize">
                        {proj.supply.category || 'Sin categoría'}
                      </CardDescription>
                    </div>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stock actual:</span>
                      <span className="font-medium">
                        {proj.supply.current_quantity.toFixed(1)} {proj.supply.unit}
                      </span>
                    </div>
                    <Progress value={stockPercentage} className="h-2" />
                  </div>

                  <div className="neumorphic-inset p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Consumo diario:</span>
                      <span className="font-medium">
                        {proj.dailyConsumption.toFixed(1)} {proj.supply.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duración:</span>
                      <span className="font-semibold">
                        {proj.daysUntilEmpty === Infinity 
                          ? '∞ días' 
                          : `${Math.floor(proj.daysUntilEmpty)} días`}
                      </span>
                    </div>
                  </div>

                  <Badge variant={config.variant} className="w-full justify-center">
                    {config.label}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="week" className="space-y-4">
        <Card className="neumorphic border-0 mb-6">
          <CardHeader>
            <CardTitle>Recomendaciones de Compra Semanal</CardTitle>
            <CardDescription>
              Cantidades sugeridas para mantener el inventario óptimo durante 7 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projections
                .filter(p => p.weeklyRecommendation > 0)
                .map((proj) => {
                  const config = getStatusConfig(proj.status);
                  return (
                    <div
                      key={proj.supply.id}
                      className="neumorphic-inset p-4 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant={config.variant} className="capitalize">
                            {config.label}
                          </Badge>
                          <span className="font-medium">{proj.supply.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Consumo semanal estimado: {proj.weeklyConsumption.toFixed(1)} {proj.supply.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {proj.weeklyRecommendation.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">{proj.supply.unit}</div>
                      </div>
                    </div>
                  );
                })}
              {projections.filter(p => p.weeklyRecommendation > 0).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-chart-3" />
                  <p className="font-medium">El inventario está en buen estado</p>
                  <p className="text-sm mt-1">No se necesitan compras esta semana</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projections.map((proj) => {
            const config = getStatusConfig(proj.status);
            const Icon = config.icon;
            const stockPercentage = getStockPercentage(proj.supply.current_quantity, proj.supply.min_threshold);

            return (
              <Card key={proj.supply.id} className="neumorphic border-0">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-balance">{proj.supply.name}</CardTitle>
                      <CardDescription className="capitalize">
                        {proj.supply.category || 'Sin categoría'}
                      </CardDescription>
                    </div>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stock actual:</span>
                      <span className="font-medium">
                        {proj.supply.current_quantity.toFixed(1)} {proj.supply.unit}
                      </span>
                    </div>
                    <Progress value={stockPercentage} className="h-2" />
                  </div>

                  <div className="neumorphic-inset p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Consumo semanal:</span>
                      <span className="font-medium">
                        {proj.weeklyConsumption.toFixed(1)} {proj.supply.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recomendado:</span>
                      <span className="font-semibold text-primary">
                        {proj.weeklyRecommendation > 0 
                          ? `${proj.weeklyRecommendation.toFixed(1)} ${proj.supply.unit}` 
                          : 'Suficiente'}
                      </span>
                    </div>
                  </div>

                  <Badge variant={config.variant} className="w-full justify-center">
                    {config.label}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="month" className="space-y-4">
        <Card className="neumorphic border-0 mb-6">
          <CardHeader>
            <CardTitle>Plan de Compras Mensual</CardTitle>
            <CardDescription>
              Planificación de inventario para los próximos 30 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projections
                .filter(p => p.monthlyRecommendation > 0)
                .map((proj) => {
                  const config = getStatusConfig(proj.status);
                  return (
                    <div
                      key={proj.supply.id}
                      className="neumorphic-inset p-4 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant={config.variant} className="capitalize">
                            {config.label}
                          </Badge>
                          <span className="font-medium">{proj.supply.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Consumo mensual estimado: {proj.monthlyConsumption.toFixed(1)} {proj.supply.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {proj.monthlyRecommendation.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">{proj.supply.unit}</div>
                      </div>
                    </div>
                  );
                })}
              {projections.filter(p => p.monthlyRecommendation > 0).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-chart-3" />
                  <p className="font-medium">Inventario completamente abastecido</p>
                  <p className="text-sm mt-1">No se necesitan compras este mes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projections.map((proj) => {
            const config = getStatusConfig(proj.status);
            const Icon = config.icon;
            const stockPercentage = getStockPercentage(proj.supply.current_quantity, proj.supply.min_threshold);

            return (
              <Card key={proj.supply.id} className="neumorphic border-0">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-balance">{proj.supply.name}</CardTitle>
                      <CardDescription className="capitalize">
                        {proj.supply.category || 'Sin categoría'}
                      </CardDescription>
                    </div>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stock actual:</span>
                      <span className="font-medium">
                        {proj.supply.current_quantity.toFixed(1)} {proj.supply.unit}
                      </span>
                    </div>
                    <Progress value={stockPercentage} className="h-2" />
                  </div>

                  <div className="neumorphic-inset p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Consumo mensual:</span>
                      <span className="font-medium">
                        {proj.monthlyConsumption.toFixed(1)} {proj.supply.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recomendado:</span>
                      <span className="font-semibold text-primary">
                        {proj.monthlyRecommendation > 0 
                          ? `${proj.monthlyRecommendation.toFixed(1)} ${proj.supply.unit}` 
                          : 'Suficiente'}
                      </span>
                    </div>
                  </div>

                  <Badge variant={config.variant} className="w-full justify-center">
                    {config.label}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  );
}
