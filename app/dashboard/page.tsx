import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatsOverview } from "@/components/stats-overview";
import { UrgentSuppliesAlert } from "@/components/urgent-supplies-alert";

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
      <main className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-balance">Vista General del Negocio</h1>
          <p className="text-muted-foreground">Resumen de tu establecimiento</p>
        </div>
        
        <StatsOverview />
        
        <div className="mt-8">
          <UrgentSuppliesAlert />
        </div>
      </main>
    </DashboardLayout>
  );
}
