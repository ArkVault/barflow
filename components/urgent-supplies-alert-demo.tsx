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
import { SupplyStockGaugeCaption } from "@/components/presentation/supply-stock-gauge-caption";

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
                <SupplyStockGaugeCaption
                  currentQuantity={supply.current_quantity}
                  minThreshold={supply.min_threshold}
                  unit={supply.unit}
                  variant="demo"
                />
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
