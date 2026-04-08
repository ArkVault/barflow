import { ProdShell } from "@/components/shells";
import { ProjectionView } from "@/components/projection-view";
import { GenerateProjectionsButton } from "@/components/generate-projections-button";
import { getProyeccionesViewModel } from "@/lib/features/dashboard/server/get-proyecciones-view-model";

export default async function ProyeccionesPage() {
  const vm = await getProyeccionesViewModel();

  return (
    <ProdShell userName={vm.userName} establishmentName={vm.establishmentName}>
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Proyecciones Inteligentes</h1>
            <p className="text-muted-foreground">
              Planifica tu inventario con predicciones basadas en IA
            </p>
          </div>
          <GenerateProjectionsButton
            establishmentId={vm.establishmentId}
            supplies={vm.supplies}
            sales={vm.sales}
          />
        </div>
        <ProjectionView
          establishmentId={vm.establishmentId}
          supplies={vm.supplies}
          sales={vm.sales}
        />
      </main>
    </ProdShell>
  );
}
