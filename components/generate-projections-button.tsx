"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from 'lucide-react';

interface GenerateProjectionsButtonProps {
  establishmentId: string;
  supplies: any[];
  sales: any[];
}

export function GenerateProjectionsButton({ supplies, sales }: GenerateProjectionsButtonProps) {
  const hasData = supplies.length > 0 && sales.length > 0;

  if (!hasData) {
    return null;
  }

  return (
    <Button className="neumorphic-hover border-0 gap-2" disabled>
      <Sparkles className="h-4 w-4" />
      Proyecciones Activas
    </Button>
  );
}
