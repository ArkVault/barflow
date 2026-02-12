import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SalesStats } from "@/components/sales/sales-stats";
import { SalesTable } from "@/components/sales/sales-table";
import { SalesChart } from "@/components/sales/sales-chart";
import { RecordSaleDialog } from "@/components/sales/record-sale-dialog";

export default async function VentasPage() {
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

  if (!establishment) {
    redirect("/auth/login");
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, category")
    .eq("establishment_id", establishment.id)
    .eq("is_active", true)
    .order("name");

  const { data: sales } = await supabase
    .from("sales")
    .select(`
      *,
      products (
        id,
        name,
        category
      )
    `)
    .eq("establishment_id", establishment.id)
    .order("sale_date", { ascending: false })
    .limit(50);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: chartData } = await supabase
    .from("sales")
    .select("sale_date, total_price")
    .eq("establishment_id", establishment.id)
    .gte("sale_date", thirtyDaysAgo.toISOString())
    .order("sale_date", { ascending: true });

  return (
    <DashboardLayout
      userName={data.user.email || ""}
      establishmentName={establishment.name}
      pageTitle="Ventas y Contabilidad"
      pageDescription="Gestiona tus ventas y analiza tus ingresos"
      headerActions={<RecordSaleDialog establishmentId={establishment.id} products={products || []} />}
    >
      <main className="container mx-auto p-6">
        <div className="space-y-6">
          <SalesStats establishmentId={establishment.id} />
          <SalesChart data={chartData || []} />
          <SalesTable sales={sales || []} />
        </div>
      </main>
    </DashboardLayout>
  );
}
