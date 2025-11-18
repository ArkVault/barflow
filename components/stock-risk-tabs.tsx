"use client";

import { useState } from "react";
import useSWR from "swr";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type UrgencyPeriod = "day" | "week" | "month";

type UrgentSupply = {
  id: string;
  urgencyLevel: "critical" | "warning" | "low";
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function StockRiskTabs() {
  const [period, setPeriod] = useState<UrgencyPeriod>("week");

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

  return (
    <Card className="neumorphic border-0 mt-6 inline-block">
      <CardContent className="py-4 px-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Riesgo de stock por periodo</p>
          <p className="text-xs text-muted-foreground">Visualiza cuántos insumos están en nivel crítico o bajo según el horizonte de tiempo.</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          <Tabs
            value={period}
            onValueChange={(value) => setPeriod(value as UrgencyPeriod)}
            className="w-auto"
          >
            <TabsList className="grid grid-cols-3 h-9">
              <TabsTrigger value="day">Día</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mes</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Badge variant="destructive" className="px-2 py-0.5 text-[11px]">Crítico</Badge>
              <span className="font-semibold text-sm">{isLoading ? "-" : criticalCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-amber-500 text-white px-2 py-0.5 text-[11px]">Bajo</Badge>
              <span className="font-semibold text-sm">{isLoading ? "-" : warningCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
