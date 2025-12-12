"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/use-language";
import useSWR from "swr";
import { useState } from "react";
import { usePeriod } from "@/contexts/period-context";

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type UrgencyPeriod = "day" | "week" | "month";

function getStockRatio(current: number, min: number) {
  if (min <= 0) return 1;
  return current / min;
}

function getGaugeColor(ratio: number) {
  if (ratio >= 1) return "text-emerald-500";
  if (ratio >= 0.6) return "text-amber-500";
  return "text-red-500";
}

function SemiCircleGauge({ ratio }: { ratio: number }) {
  const clamped = Math.max(0, Math.min(ratio, 1.5));
  const percent = (clamped / 1) * 100;
  const circumference = Math.PI * 50;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  const colorClass = getGaugeColor(ratio).replace("text-", "stroke-");

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

export function UrgentSuppliesAlert() {
  const { t } = useLanguage();
  const { period } = usePeriod();
  const [statusFilter, setStatusFilter] = useState<"all" | "critical" | "warning" | "optimal">("all");

  const { data, error, isLoading } = useSWR<{ supplies: UrgentSupply[] }>(
    `/api/supplies/urgent?period=${period}`,
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  );

  if (error) {
    return (
      <Card className="neumorphic border-0">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            ⚠️ {t('urgentSupplies')}
          </CardTitle>
          <CardDescription>{t('errorLoadingData')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="neumorphic border-0">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            ⚠️ {t('urgentSupplies')}
          </CardTitle>
          <CardDescription>{t('loading')}...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const urgentSupplies = data?.supplies || [];

  if (urgentSupplies.length === 0) {
    return (
      <Card className="neumorphic border-0">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            ✅ Inventario saludable
          </CardTitle>
          <CardDescription>No hay insumos críticos para el periodo seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Todos los insumos tienen stock suficiente para el periodo seleccionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  const criticalSupplies = urgentSupplies.filter((s) => s.urgencyLevel === 'critical');
  const warningSupplies = urgentSupplies.filter((s) => s.urgencyLevel === 'warning');
  const optimalSupplies = urgentSupplies.filter((s) => s.urgencyLevel === 'low');

  let visibleSupplies: UrgentSupply[] = urgentSupplies;

  if (statusFilter === 'critical') visibleSupplies = criticalSupplies;
  if (statusFilter === 'warning') visibleSupplies = warningSupplies;
  if (statusFilter === 'optimal') visibleSupplies = optimalSupplies;

  const getUrgencyBadge = (level: string, days: number) => {
    if (level === 'critical') {
      return <Badge variant="destructive" className="neumorphic-inset">Crítico ({days}d)</Badge>;
    } else if (level === 'warning') {
      return <Badge className="neumorphic-inset bg-amber-500 text-white">Urgente ({days}d)</Badge>;
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
              ⚠️ Insumos urgentes
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
                    <SemiCircleGauge ratio={getStockRatio(supply.current_quantity, supply.min_threshold)} />
                    <span className="mt-1">
                      {supply.current_quantity} / {supply.min_threshold} {supply.unit}
                    </span>
                  </div>
                  {getUrgencyBadge(supply.urgencyLevel, supply.daysUntilDepleted)}
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
