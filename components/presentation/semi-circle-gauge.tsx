"use client";

export type GaugeVariant = "demo" | "prod";

interface SemiCircleGaugeProps {
  ratio: number;
  variant?: GaugeVariant;
}

function getGaugeStrokeClass(ratio: number, variant: GaugeVariant): string {
  if (variant === "demo") {
    if (ratio <= 0.4) return "stroke-red-500";
    if (ratio <= 0.6) return "stroke-amber-500";
    return "stroke-emerald-500";
  }

  if (ratio >= 1) return "stroke-emerald-500";
  if (ratio >= 0.6) return "stroke-amber-500";
  return "stroke-red-500";
}

export function SemiCircleGauge({ ratio, variant = "prod" }: SemiCircleGaugeProps) {
  const maxRatio = variant === "demo" ? 1 : 1.5;
  const clamped = Math.max(0, Math.min(ratio, maxRatio));
  const percent = (clamped / 1) * 100;
  const circumference = Math.PI * 50;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  const strokeClass = getGaugeStrokeClass(ratio, variant);

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
          className={strokeClass}
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
