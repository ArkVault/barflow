import { ProdShell } from "@/components/shells";
import { SuppliesTable } from "@/components/supplies-table";
import { AddSupplyDialog } from "@/components/add-supply-dialog";
import { GlowButton } from "@/components/glow-button";
import { ShoppingCart } from "lucide-react";
import { getInsumosViewModel } from "@/lib/features/dashboard/server/get-insumos-view-model";

export default async function InsumosPage() {
  const vm = await getInsumosViewModel();

  return (
    <ProdShell
      userName={vm.userName}
      establishmentName={vm.establishmentName}
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
          <AddSupplyDialog establishmentId={vm.establishmentId} />
        </div>
      }
    >
      <main className="container mx-auto p-6">
        <SuppliesTable supplies={vm.supplies} />
      </main>
    </ProdShell>
  );
}
