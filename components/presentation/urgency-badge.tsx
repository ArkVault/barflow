"use client";

import { Badge } from "@/components/ui/badge";
import type { UrgencyLevel } from "@/types/dashboard";

interface UrgencyBadgeProps {
  level: UrgencyLevel;
  days: number;
  labels: {
    critical: string;
    warning: string;
    low: string;
  };
  overrideLevel?: UrgencyLevel;
}

export function UrgencyBadge({ level, days, labels, overrideLevel }: UrgencyBadgeProps) {
  const effectiveLevel = overrideLevel ?? level;

  if (effectiveLevel === "critical") {
    return (
      <Badge variant="destructive" className="neumorphic-inset">
        {labels.critical} ({days}d)
      </Badge>
    );
  }

  if (effectiveLevel === "warning") {
    return (
      <Badge className="neumorphic-inset bg-amber-500 text-white">
        {labels.warning} ({days}d)
      </Badge>
    );
  }

  return (
    <Badge className="neumorphic-inset bg-emerald-500/10 text-emerald-600">
      {labels.low} ({days}d)
    </Badge>
  );
}
