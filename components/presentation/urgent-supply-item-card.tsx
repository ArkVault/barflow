"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { UrgentSupply } from "@/types/dashboard";

interface UrgentSupplyItemCardProps {
  supply: UrgentSupply;
  gaugeSlot: ReactNode;
  badgeSlot: ReactNode;
  labels: {
    currentStock: string;
    minimum: string;
    usedIn: string;
  };
}

export function UrgentSupplyItemCard({
  supply,
  gaugeSlot,
  badgeSlot,
  labels,
}: UrgentSupplyItemCardProps) {
  return (
    <div className="neumorphic-inset p-4 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-2">
        <div>
          <h4 className="font-semibold text-lg">{supply.name}</h4>
          <p className="text-sm text-muted-foreground">{supply.category}</p>
        </div>
        <div className="flex items-center gap-4">
          {gaugeSlot}
          {badgeSlot}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div>
          <span className="text-muted-foreground">{labels.currentStock}:</span>
          <span className="ml-2 font-medium">
            {supply.current_quantity} {supply.unit}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">{labels.minimum}:</span>
          <span className="ml-2 font-medium">
            {supply.min_threshold} {supply.unit}
          </span>
        </div>
      </div>

      {supply.products.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">{labels.usedIn}:</p>
          <div className="flex flex-wrap gap-1">
            {supply.products.map((product, idx) => (
              <Badge key={idx} variant="outline" className="text-xs neumorphic">
                {product.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
