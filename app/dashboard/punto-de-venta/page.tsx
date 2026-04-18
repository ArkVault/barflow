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
      <div className="px-6 md:px-8 lg:px-10 py-6 md:py-8 max-w-5xl mx-auto">
        <PuntoDeVentaContent role={role} />
      </div>
    </ProdShell>
  );
}
