"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { StatsOverview } from "@/components/stats-overview";
import { UrgentSuppliesAlert } from "@/components/urgent-supplies-alert";
import { StockRiskTabs } from "@/components/stock-risk-tabs";
import { StockTrafficLight } from "@/components/stock-traffic-light";
import { PeriodProvider } from "@/contexts/period-context";

interface DashboardContentProps {
     userName: string;
     establishmentName: string;
}

export function DashboardContent({ userName, establishmentName }: DashboardContentProps) {
     return (
          <PeriodProvider>
               <DashboardLayout
                    userName={userName}
                    establishmentName={establishmentName}
                    pageTitle="Resumen del Negocio"
                    pageDescription="Vista general de tu establecimiento"
                    // Pass StockTrafficLight as headerActions.
                    // Important: StockTrafficLight uses usePeriod, which is provided by PeriodProvider wrapping DashboardLayout.
                    // However, headerActions is rendered inside DashboardLayout, which is a child of PeriodProvider here.
                    // So this should work. The error happens if StockTrafficLight is rendered OUTSIDE PeriodProvider.
                    // In the previous version, DashboardLayout was parent of PeriodProvider.
                    // Now PeriodProvider wraps DashboardLayout, so headerActions (passed as prop) 
                    // will be rendered inside DashboardLayout but they are defined here in the JSX tree.
                    // The issue is that the <StockTrafficLight /> element is instantiated HERE, 
                    // inside DashboardContent. DashboardContent -> PeriodProvider -> ...
                    // So if StockTrafficLight is inside PeriodProvider, it should be fine.
                    headerActions={<StockTrafficLight />}
               >
                    <div className="space-y-8">
                         <StatsOverview />

                         <div className="space-y-6">
                              <UrgentSuppliesAlert />
                              <StockRiskTabs />
                         </div>
                    </div>
               </DashboardLayout>
          </PeriodProvider>
     );
}
