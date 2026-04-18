"use client";

import { ProdShell } from "@/components/shells";
import { ProyeccionesTabs } from "@/components/proyecciones-tabs";
import { useAuth } from "@/contexts/auth-context";

export default function ProyeccionesPage() {
  const { user, establishmentName } = useAuth();

  return (
    <ProdShell
      userName={user?.email || "Usuario"}
      establishmentName={establishmentName || "Mi Negocio"}
    >
      <main className="px-6 md:px-8 lg:px-10 py-6 md:py-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Proyecciones Inteligentes</h1>
          <p className="text-muted-foreground">
            Planifica tu inventario con predicciones basadas en IA
          </p>
        </div>
        <ProyeccionesTabs />
      </main>
    </ProdShell>
  );
}
