"use client";

import { Badge } from "@/components/ui/badge";
import { usePeriod } from "@/contexts/period-context";
import { useMemo, useEffect, useState } from "react";
import { getUserPlan, convertPlanToSupplies, getSuppliesByViewPeriod } from "@/lib/planner-data";
import { getSuppliesByPeriod, type UrgencyPeriod } from "@/lib/mock-data";

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
    <div className="flex items-center gap-1 rounded-full bg-muted p-1 text-xs w-fit">
      {(["day", "week", "month"] as UrgencyPeriod[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setPeriod(p)}
          className={`px-3 py-1 rounded-full transition-colors ${
            period === p
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {p === "day" ? "Día" : p === "week" ? "Semana" : "Mes"}
        </button>
      ))}
    </div>
  );
}
