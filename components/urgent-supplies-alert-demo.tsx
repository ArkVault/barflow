"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect } from "react";
import { usePeriod } from "@/contexts/period-context";
import { getUserPlan, convertPlanToSupplies, getSuppliesByViewPeriod } from "@/lib/planner-data";
import { getSuppliesByPeriod, type UrgencyPeriod } from "@/lib/mock-data";

interface UrgentSupply {
  id: string;
  name: string;
  current_quantity: number;
  min_threshold: number;
  unit: string;
  category: string;
  daysUntilDepleted: number;
  urgencyLevel: 'critical' | 'warning' | 'low';
  products: {
    name: string;
    category: string;
    quantityNeeded: number;
  }[];
}

function getStockRatio(current: number, max: number) {
  if (max <= 0) return 1;
  return current / max;
}

function getGaugeColorByRatio(ratio: number) {
  // 0-2/5 (0-40%) = Rojo (crítico)
  if (ratio <= 0.4) return "stroke-red-500";
  // 3/5 (40-60%) = Naranja (bajo)
  if (ratio <= 0.6) return "stroke-amber-500";
  // 4/5-5/5 (60-100%+) = Verde (óptimo)
  return "stroke-emerald-500";
}

function SemiCircleGauge({ current, max }: { current: number; max: number }) {
  const ratio = getStockRatio(current, max);
  const clamped = Math.max(0, Math.min(ratio, 1));
  const percent = clamped * 100;
  const circumference = Math.PI * 50;
  const offset = circumference - (percent / 100) * circumference;
  const colorClass = getGaugeColorByRatio(ratio);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg viewBox="0 0 120 60" className="w-16 h-8">
        <path
          d="M10 50 A50 50 0 0 1 110 50"
          className="stroke-muted/40"
          strokeWidth={8}
          fill="none"
        />
        <path
          d="M10 50 A50 50 0 0 1 110 50"
          className={colorClass}
          strokeWidth={8}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function UrgentSuppliesAlertDemo() {
  const { period } = usePeriod();
  const [statusFilter, setStatusFilter] = useState<"all" | "critical" | "warning" | "optimal">("all");
  const [planSupplies, setPlanSupplies] = useState<any[]>([]);

  useEffect(() => {
    // Get user's plan from localStorage
    const userPlan = getUserPlan();

    if (userPlan) {
      // Convert plan to supplies format
      const supplies = convertPlanToSupplies(userPlan);
      setPlanSupplies(supplies);
    } else {
      // Fallback to mock data if no plan exists
      setPlanSupplies(getSuppliesByPeriod(period as UrgencyPeriod));
    }
  }, [period]);

  const urgentSupplies = useMemo(() => {
    if (planSupplies.length === 0) return [];

    // Filter by view period (día/semana/mes)
    return getSuppliesByViewPeriod(planSupplies, period as UrgencyPeriod);
  }, [planSupplies, period]);

  const criticalSupplies = urgentSupplies.filter((s) => s.urgencyLevel === 'critical');
  const warningSupplies = urgentSupplies.filter((s) => s.urgencyLevel === 'warning');
  const optimalSupplies = urgentSupplies.filter((s) => s.urgencyLevel === 'low');

  let visibleSupplies: UrgentSupply[] = urgentSupplies;

  if (statusFilter === 'critical') visibleSupplies = criticalSupplies;
  if (statusFilter === 'warning') visibleSupplies = warningSupplies;
  if (statusFilter === 'optimal') visibleSupplies = optimalSupplies;

  const getUrgencyBadge = (level: string, days: number, filterActive: string) => {
    // Si hay un filtro activo que no es 'all', usar el color del filtro
    if (filterActive === 'critical') {
      return <Badge variant="destructive" className="neumorphic-inset">Crítico ({days}d)</Badge>;
    } else if (filterActive === 'warning') {
      return <Badge className="neumorphic-inset bg-amber-500 text-white">Bajo ({days}d)</Badge>;
    } else if (filterActive === 'optimal') {
      return <Badge className="neumorphic-inset bg-emerald-500/10 text-emerald-600">Bien ({days}d)</Badge>;
    }

    // Si no hay filtro, usar el nivel real del insumo
    if (level === 'critical') {
      return <Badge variant="destructive" className="neumorphic-inset">Crítico ({days}d)</Badge>;
    } else if (level === 'warning') {
      return <Badge className="neumorphic-inset bg-amber-500 text-white">Bajo ({days}d)</Badge>;
    } else {
      return <Badge className="neumorphic-inset bg-emerald-500/10 text-emerald-600">Bien ({days}d)</Badge>;
    }
  };

  return (
    <Card className="neumorphic border-0">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              📦 Insumos necesarios
            </CardTitle>
            <CardDescription>
              {visibleSupplies.length} insumo{visibleSupplies.length !== 1 ? 's' : ''} en el estado seleccionado para este periodo
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setStatusFilter('critical')}
                className={`px-2 py-1 rounded-full flex items-center gap-1 ${statusFilter === 'critical' ? 'bg-destructive text-destructive-foreground' : 'hover:bg-destructive/10'
                  }`}
              >
                <span className="h-2 w-2 rounded-full bg-destructive" />
                <span>Crítico</span>
                <span className="text-[10px] opacity-80">({criticalSupplies.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('warning')}
                className={`px-2 py-1 rounded-full flex items-center gap-1 ${statusFilter === 'warning' ? 'bg-amber-500 text-white' : 'hover:bg-amber-500/10'
                  }`}
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Bajo</span>
                <span className="text-[10px] opacity-80">({warningSupplies.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('optimal')}
                className={`px-2 py-1 rounded-full flex items-center gap-1 ${statusFilter === 'optimal' ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
                  }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Bien</span>
                <span className="text-[10px] opacity-80">({optimalSupplies.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 rounded-full ${statusFilter === 'all' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/60'
                  }`}
              >
                Ver todo
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleSupplies.map((supply) => (
            <div
              key={supply.id}
              className="neumorphic-inset p-4 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-lg">{supply.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {supply.category}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center text-xs text-muted-foreground">
                    <SemiCircleGauge
                      current={supply.current_quantity}
                      max={supply.min_threshold}
                    />
                    <span className="mt-1">
                      {supply.current_quantity} / {supply.min_threshold} {supply.unit}
                    </span>
                  </div>
                  {getUrgencyBadge(supply.urgencyLevel, supply.daysUntilDepleted, statusFilter)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Stock actual:</span>
                  <span className="ml-2 font-medium">
                    {supply.current_quantity} {supply.unit}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mínimo:</span>
                  <span className="ml-2 font-medium">
                    {supply.min_threshold} {supply.unit}
                  </span>
                </div>
              </div>

              {supply.products.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    Utilizado en:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {supply.products.map((product, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs neumorphic"
                      >
                        {product.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
