"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useState, useMemo, useEffect } from "react";
import { usePeriod } from "@/contexts/period-context";
import { getUserPlan, convertPlanToSupplies, getSuppliesByViewPeriod } from "@/lib/planner-data";
import { getSuppliesByPeriod, type UrgencyPeriod } from "@/lib/mock-data";
import type { UrgentSupply, UrgencyLevel } from "@/types/dashboard";
import { UrgencyFilterPills, type UrgencyFilter } from "@/components/presentation/urgency-filter-pills";
import { UrgencyBadge } from "@/components/presentation/urgency-badge";
import { StatusCardHeader } from "@/components/presentation/status-card-header";
import { UrgentSupplyItemCard } from "@/components/presentation/urgent-supply-item-card";

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
  const [statusFilter, setStatusFilter] = useState<UrgencyFilter>("all");
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

  return (
    <Card className="neumorphic border-0">
      <StatusCardHeader
        icon="📦"
        title="Insumos necesarios"
        description={`${visibleSupplies.length} insumo${visibleSupplies.length !== 1 ? "s" : ""} en el estado seleccionado para este periodo`}
        rightSlot={
          <UrgencyFilterPills
            value={statusFilter}
            onChange={setStatusFilter}
            counts={{
              critical: criticalSupplies.length,
              warning: warningSupplies.length,
              optimal: optimalSupplies.length,
            }}
            labels={{
              critical: "Crítico",
              warning: "Bajo",
              optimal: "Bien",
              all: "Ver todo",
            }}
          />
        }
      />
      <CardContent>
        <div className="space-y-4">
          {visibleSupplies.map((supply) => (
            <UrgentSupplyItemCard
              key={supply.id}
              supply={supply}
              labels={{
                currentStock: "Stock actual",
                minimum: "Mínimo",
                usedIn: "Utilizado en",
              }}
              gaugeSlot={
                <div className="flex flex-col items-center text-xs text-muted-foreground">
                  <SemiCircleGauge
                    current={supply.current_quantity}
                    max={supply.min_threshold}
                  />
                  <span className="mt-1">
                    {supply.current_quantity} / {supply.min_threshold} {supply.unit}
                  </span>
                </div>
              }
              badgeSlot={
                <UrgencyBadge
                  level={supply.urgencyLevel}
                  days={supply.daysUntilDepleted}
                  overrideLevel={statusFilter === "all" ? undefined : (statusFilter as UrgencyLevel)}
                  labels={{
                    critical: "Crítico",
                    warning: "Bajo",
                    low: "Bien",
                  }}
                />
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
