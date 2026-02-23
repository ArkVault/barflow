"use client";

import { SemiCircleGauge, type GaugeVariant } from "@/components/presentation/semi-circle-gauge";

interface SupplyStockGaugeCaptionProps {
  currentQuantity: number;
  minThreshold: number;
  unit: string;
  variant: GaugeVariant;
}

function getStockRatio(current: number, min: number) {
  if (min <= 0) return 1;
  return current / min;
}

export function SupplyStockGaugeCaption({
  currentQuantity,
  minThreshold,
  unit,
  variant,
}: SupplyStockGaugeCaptionProps) {
  return (
    <div className="flex flex-col items-center text-xs text-muted-foreground">
      <SemiCircleGauge
        ratio={getStockRatio(currentQuantity, minThreshold)}
        variant={variant}
      />
      <span className="mt-1">
        {currentQuantity} / {minThreshold} {unit}
      </span>
    </div>
  );
}
