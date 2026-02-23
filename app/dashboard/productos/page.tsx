import Link from "next/link";
import { ProdShell } from "@/components/shells";
import { ProductsPageClient } from "@/components/products-page-client";
import { GlowButton } from "@/components/glow-button";
import { ArrowLeft } from "lucide-react";
import { getProductosViewModel } from "@/lib/features/dashboard/server/get-productos-view-model";

export default async function ProductosPage() {
  const vm = await getProductosViewModel();

  return (
    <ProdShell
      userName={vm.userName}
      establishmentName={vm.establishmentName}
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
          initialProducts={vm.products}
          supplies={vm.supplies}
          establishmentId={vm.establishmentId}
        />
      </main>
    </ProdShell>
  );
}
