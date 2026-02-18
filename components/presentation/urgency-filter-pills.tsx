"use client";

type UrgencyFilter = "all" | "critical" | "warning" | "optimal";

interface UrgencyFilterPillsProps {
  value: UrgencyFilter;
  onChange: (value: UrgencyFilter) => void;
  counts: {
    critical: number;
    warning: number;
    optimal: number;
  };
  labels: {
    critical: string;
    warning: string;
    optimal: string;
    all: string;
  };
}

export function UrgencyFilterPills({
  value,
  onChange,
  counts,
  labels,
}: UrgencyFilterPillsProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-[11px]">
      <button
        type="button"
        onClick={() => onChange("critical")}
        className={`px-2 py-1 rounded-full flex items-center gap-1 ${
          value === "critical" ? "bg-destructive text-destructive-foreground" : "hover:bg-destructive/10"
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-destructive" />
        <span>{labels.critical}</span>
        <span className="text-[10px] opacity-80">({counts.critical})</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("warning")}
        className={`px-2 py-1 rounded-full flex items-center gap-1 ${
          value === "warning" ? "bg-amber-500 text-white" : "hover:bg-amber-500/10"
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        <span>{labels.warning}</span>
        <span className="text-[10px] opacity-80">({counts.warning})</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("optimal")}
        className={`px-2 py-1 rounded-full flex items-center gap-1 ${
          value === "optimal" ? "bg-emerald-500 text-white" : "hover:bg-emerald-500/10"
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span>{labels.optimal}</span>
        <span className="text-[10px] opacity-80">({counts.optimal})</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("all")}
        className={`px-2 py-1 rounded-full ${
          value === "all" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/60"
        }`}
      >
        {labels.all}
      </button>
    </div>
  );
}

export type { UrgencyFilter };
