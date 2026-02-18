"use client";

import { Badge } from "@/components/ui/badge";
import { usePeriod } from "@/contexts/period-context";
import { useMemo, useEffect, useState } from "react";
import { getUserPlan, convertPlanToSupplies, getSuppliesByViewPeriod } from "@/lib/planner-data";
import { getSuppliesByPeriod } from "@/lib/mock-data";
import type { UrgencyPeriod } from "@/types/dashboard";
import { PeriodSelector } from "@/components/presentation/period-selector";

export function StockTrafficLightDemo() {
  const { period, setPeriod } = usePeriod();
  const [planSupplies, setPlanSupplies] = useState<any[]>([]);

  useEffect(() => {
    const userPlan = getUserPlan();
    
    if (userPlan) {
      const supplies = convertPlanToSupplies(userPlan);
      setPlanSupplies(supplies);
    } else {
      setPlanSupplies(getSuppliesByPeriod(period as UrgencyPeriod));
    }
  }, [period]);

  const supplies = useMemo(() => {
    if (planSupplies.length === 0) return [];
    return getSuppliesByViewPeriod(planSupplies, period as UrgencyPeriod);
  }, [planSupplies, period]);

  const criticalCount = supplies.filter((s) => s.urgencyLevel === "critical").length;
  const warningCount = supplies.filter((s) => s.urgencyLevel === "warning").length;
  const optimalCount = supplies.filter((s) => s.urgencyLevel === "low").length;

  return (
    <PeriodSelector
      value={period}
      onChange={setPeriod}
      variant="demo"
      labels={{
        day: "Día",
        week: "Semana",
        month: "Mes",
      }}
    />
  );
}
