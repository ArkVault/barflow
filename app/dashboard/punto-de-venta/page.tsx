"use client";

import { ProdShell } from "@/components/shells";
import { PuntoDeVentaContent } from "@/components/punto-de-venta-content";
import { useAuth } from "@/contexts/auth-context";
import { useStaff } from "@/contexts/staff-context";

export default function PuntoDeVentaPage() {
  const { user, establishmentName } = useAuth();
  const { role } = useStaff();

  return (
    <ProdShell
      userName={user?.email || "Usuario"}
      establishmentName={establishmentName || "Mi Negocio"}
    >
      <div className="p-6 max-w-5xl mx-auto">
        <PuntoDeVentaContent role={role} />
      </div>
    </ProdShell>
  );
}
