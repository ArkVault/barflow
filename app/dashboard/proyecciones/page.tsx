"use client";

import { ProdShell } from "@/components/shells";
import { ProyeccionesContent } from "@/components/proyecciones-content";
import { useAuth } from "@/contexts/auth-context";

export default function ProyeccionesPage() {
  const { user, establishmentName } = useAuth();

  return (
    <ProdShell
      userName={user?.email || "Usuario"}
      establishmentName={establishmentName || "Mi Negocio"}
    >
      <div className="p-6 max-w-5xl mx-auto">
        <ProyeccionesContent />
      </div>
    </ProdShell>
  );
}
