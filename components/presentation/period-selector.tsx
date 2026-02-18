"use client";

import { cn } from "@/lib/utils";
import type { UrgencyPeriod } from "@/types/dashboard";

interface PeriodSelectorProps {
  value: UrgencyPeriod;
  onChange: (period: UrgencyPeriod) => void;
  labels: Record<UrgencyPeriod, string>;
  variant?: "demo" | "prod";
}

export function PeriodSelector({
  value,
  onChange,
  labels,
  variant = "prod",
}: PeriodSelectorProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted p-1 text-xs",
        variant === "demo" && "w-fit"
      )}
    >
      {(["day", "week", "month"] as UrgencyPeriod[]).map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => onChange(period)}
          className={cn(
            "px-3 py-1 rounded-full transition-colors",
            value === period
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {labels[period]}
        </button>
      ))}
    </div>
  );
}
