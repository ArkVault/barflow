import type { UrgencyLevel, UrgencyPeriod } from "@/types/dashboard";

export function calculateDaysUntilDepleted(currentQuantity: number, minThreshold: number): number {
  if (minThreshold <= 0) return 0;
  return Math.floor((currentQuantity / minThreshold) * 7);
}

export function calculateUrgencyLevel(daysUntilDepleted: number, period: UrgencyPeriod): UrgencyLevel {
  if (period === "day") {
    if (daysUntilDepleted <= 1) return "critical";
    if (daysUntilDepleted <= 2) return "warning";
    return "low";
  }

  if (period === "week") {
    if (daysUntilDepleted <= 2) return "critical";
    if (daysUntilDepleted <= 5) return "warning";
    return "low";
  }

  if (daysUntilDepleted <= 7) return "critical";
  if (daysUntilDepleted <= 14) return "warning";
  return "low";
}

export function normalizeUrgencyPeriod(value?: string | null): UrgencyPeriod {
  if (value === "day" || value === "week" || value === "month") return value;
  return "week";
}
