import { DashboardHeader } from "@/components/dashboard-header";
import { StatsOverview } from "@/components/stats-overview";
import { UrgentSuppliesAlert } from "@/components/urgent-supplies-alert";
import { StockRiskTabs } from "@/components/stock-risk-tabs";
import { StockTrafficLight } from "@/components/stock-traffic-light";
import { PeriodProvider } from "@/contexts/period-context";
import { ProdShell } from "@/components/shells";
import { getDashboardHomeViewModel } from "@/lib/features/dashboard/server/get-dashboard-home-view-model";

export default async function DashboardPage() {
  const vm = await getDashboardHomeViewModel();

  return (
    <ProdShell userName={vm.userName} establishmentName={vm.establishmentName}>
      <PeriodProvider>
        <main className="container mx-auto p-6">
          <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <DashboardHeader />
            <StockTrafficLight />
          </div>

          <StatsOverview />

          <div className="mt-8 space-y-6">
            <UrgentSuppliesAlert />
            <StockRiskTabs />
          </div>
        </main>
      </PeriodProvider>
    </ProdShell>
  );
}
