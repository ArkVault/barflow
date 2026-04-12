"use client";

import { ProdShell } from "@/components/shells";
import { StatsOverview } from "@/components/stats-overview";
import { UrgentSuppliesAlert } from "@/components/urgent-supplies-alert";
import { StockRiskTabs } from "@/components/stock-risk-tabs";
import { StockTrafficLight } from "@/components/stock-traffic-light";
import { PeriodProvider } from "@/contexts/period-context";

interface DashboardContentProps {
  userName: string;
  establishmentName: string;
}

export function DashboardContent({
  userName,
  establishmentName,
}: DashboardContentProps) {
  return (
    <PeriodProvider>
      <ProdShell userName={userName} establishmentName={establishmentName}>
        <main className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Resumen del Negocio</h1>
              <p className="text-muted-foreground">
                Vista general de tu establecimiento
              </p>
            </div>
            <StockTrafficLight />
          </div>
          <div className="space-y-8">
            <StatsOverview />
            <div className="space-y-6">
              <UrgentSuppliesAlert />
              <StockRiskTabs />
            </div>
          </div>
        </main>
      </ProdShell>
    </PeriodProvider>
  );
}
