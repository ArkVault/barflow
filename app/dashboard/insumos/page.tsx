import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SuppliesTable } from "@/components/supplies-table";
import { AddSupplyDialog } from "@/components/add-supply-dialog";

export default async function InsumosPage() {
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

  const { data: supplies } = await supabase
    .from("supplies")
    .select("*")
    .eq("establishment_id", establishment.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout
      userName={data.user.email || ""}
      establishmentName={establishment.name}
      pageTitle="Gestión de Insumos"
      pageDescription="Administra tu inventario y stock"
      headerActions={<AddSupplyDialog establishmentId={establishment.id} />}
    >
      <main className="container mx-auto p-6">
        <SuppliesTable supplies={supplies || []} />
      </main>
    </DashboardLayout>
  );
}
