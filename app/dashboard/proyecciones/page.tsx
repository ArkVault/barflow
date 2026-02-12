import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProjectionView } from "@/components/projections/projection-view";
import { GenerateProjectionsButton } from "@/components/projections/generate-projections-button";

export default async function ProyeccionesPage() {
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
    .order("name");

  const { data: sales } = await supabase
    .from("sales")
    .select(`
      *,
      products (
        product_ingredients (
          supply_id,
          quantity_needed
        )
      )
    `)
    .eq("establishment_id", establishment.id)
    .order("sale_date", { ascending: false });

  return (
    <DashboardLayout
      userName={data.user.email || ""}
      establishmentName={establishment.name}
      pageTitle="Proyecciones Inteligentes"
      pageDescription="Planifica tu inventario con predicciones basadas en IA"
      headerActions={
        <GenerateProjectionsButton
          establishmentId={establishment.id}
          supplies={supplies || []}
          sales={sales || []}
        />
      }
    >
      <main className="container mx-auto p-6">
        <ProjectionView
          establishmentId={establishment.id}
          supplies={supplies || []}
          sales={sales || []}
        />
      </main>
    </DashboardLayout>
  );
}
