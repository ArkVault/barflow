import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardHeader } from "@/components/dashboard-header";
import { StatsOverview } from "@/components/stats-overview";
import { UrgentSuppliesAlert } from "@/components/urgent-supplies-alert";
import { StockRiskTabs } from "@/components/stock-risk-tabs";
import { StockTrafficLight } from "@/components/stock-traffic-light";
import { PeriodProvider } from "@/contexts/period-context";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const { data: establishment } = await supabase
    .from("establishments")
    .select("*")
    .eq("user_id", data.user.id)
    .single();

  return (
    <DashboardLayout userName={data.user.email || ""} establishmentName={establishment?.name || "Mi Establecimiento"}>
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
    </DashboardLayout>
  );
}
