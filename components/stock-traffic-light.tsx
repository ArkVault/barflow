"use client";

import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { usePeriod } from "@/contexts/period-context";

type UrgencyLevel = "critical" | "warning" | "low";
type UrgencyPeriod = "day" | "week" | "month";

type UrgentSupply = {
  id: string;
  urgencyLevel: UrgencyLevel;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function StockTrafficLight() {
  const { period, setPeriod } = usePeriod();

  const { data, isLoading } = useSWR<{ supplies: UrgentSupply[] }>(
    `/api/supplies/urgent?period=${period}`,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
    }
  );

  const supplies = data?.supplies || [];
  const criticalCount = supplies.filter((s) => s.urgencyLevel === "critical").length;
  const warningCount = supplies.filter((s) => s.urgencyLevel === "warning").length;
  const optimalCount = supplies.filter((s) => s.urgencyLevel === "low").length;

  const loadingText = isLoading ? "-" : undefined;

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-xs">
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
      <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px]">
        <span className="mr-1 text-xs text-muted-foreground">Estado</span>
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-destructive/40 text-destructive px-2 py-0.5 text-[11px]"
        >
          <span className="h-2 w-2 rounded-full bg-destructive" />
          Crit
          <span className="opacity-80">({loadingText ?? criticalCount})</span>
        </Badge>
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-amber-500/40 text-amber-600 px-2 py-0.5 text-[11px]"
        >
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Bajo
          <span className="opacity-80">({loadingText ?? warningCount})</span>
        </Badge>
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-emerald-500/40 text-emerald-600 px-2 py-0.5 text-[11px]"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Bien
          <span className="opacity-80">({loadingText ?? optimalCount})</span>
        </Badge>
      </div>
    </div>
  );
}
