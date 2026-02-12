import { redirect } from 'next/navigation';
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProductsPageClient } from "@/components/products/products-page-client";
import { GlowButton } from "@/components/layout/glow-button";
import { ArrowLeft } from "lucide-react";

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

  // Fetch all products initially (will be filtered by menu on client)
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
    .select("id, name, unit, current_quantity, category, min_threshold")
    .eq("establishment_id", establishment.id)
    .order("name");

  return (
    <DashboardLayout
      userName={data.user.email || ""}
      establishmentName={establishment.name}
      pageTitle="Gestión de Productos"
      pageDescription="Administra tu menú y recetas"
      headerActions={
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <GlowButton>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-inner">
                <ArrowLeft className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="hidden sm:inline">Dashboard</span>
            </GlowButton>
          </Link>
        </div>
      }
    >
      <main className="container mx-auto p-6">
        <ProductsPageClient
          initialProducts={products || []}
          supplies={supplies || []}
          establishmentId={establishment.id}
        />
      </main>
    </DashboardLayout>
  );
}
