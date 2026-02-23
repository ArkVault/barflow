import { ProdShell } from "@/components/shells";
import { ProjectionView } from "@/components/projection-view";
import { GenerateProjectionsButton } from "@/components/generate-projections-button";
import { getProyeccionesViewModel } from "@/lib/features/dashboard/server/get-proyecciones-view-model";

export default async function ProyeccionesPage() {
  const vm = await getProyeccionesViewModel();

  return (
    <ProdShell
      userName={vm.userName}
      establishmentName={vm.establishmentName}
      pageTitle="Proyecciones Inteligentes"
      pageDescription="Planifica tu inventario con predicciones basadas en IA"
      headerActions={
        <GenerateProjectionsButton
          establishmentId={vm.establishmentId}
          supplies={vm.supplies}
          sales={vm.sales}
        />
      }
    >
      <main className="container mx-auto p-6">
        <ProjectionView
          establishmentId={vm.establishmentId}
          supplies={vm.supplies}
          sales={vm.sales}
        />
      </main>
    </ProdShell>
  );
}
