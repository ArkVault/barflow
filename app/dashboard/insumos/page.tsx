import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SuppliesTable } from "@/components/inventory/supplies-table";
import { AddSupplyDialog } from "@/components/inventory/add-supply-dialog";
import { GlowButton } from "@/components/layout/glow-button";
import { ShoppingCart } from "lucide-react";

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
      headerActions={
        <div className="flex items-center gap-3">
          <GlowButton>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-inner">
              <ShoppingCart className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            </div>
            <span className="hidden sm:inline">Insumos a Comprar</span>
          </GlowButton>
          <AddSupplyDialog establishmentId={establishment.id} />
        </div>
      }
    >
      <main className="container mx-auto p-6">
        <SuppliesTable supplies={supplies || []} />
      </main>
    </DashboardLayout>
  );
}
