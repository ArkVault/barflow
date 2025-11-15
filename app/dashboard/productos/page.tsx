import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ProductsTable } from "@/components/products-table";
import { AddProductDialog } from "@/components/add-product-dialog";

export default async function ProductosPage() {
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
    .select(`
      *,
      product_ingredients (
        id,
        quantity_needed,
        supply_id,
        supplies (
          id,
          name,
          unit
        )
      )
    `)
    .eq("establishment_id", establishment.id)
    .order("created_at", { ascending: false });

  const { data: supplies } = await supabase
    .from("supplies")
    .select("id, name, unit, current_quantity")
    .eq("establishment_id", establishment.id)
    .order("name");

  return (
    <DashboardLayout userName={data.user.email || ""} establishmentName={establishment.name}>
      <main className="container mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-balance">Gestión de Productos</h1>
            <p className="text-muted-foreground">Administra tu menú y recetas</p>
          </div>
          <AddProductDialog establishmentId={establishment.id} supplies={supplies || []} />
        </div>
        <ProductsTable products={products || []} supplies={supplies || []} />
      </main>
    </DashboardLayout>
  );
}
