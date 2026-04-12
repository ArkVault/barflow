"use client";

import { ProdShell } from "@/components/shells";
import { PlannerContent } from "@/components/planner-content";
import { useAuth } from "@/contexts/auth-context";

export default function PlannerPage() {
  const { user, establishmentName } = useAuth();

  return (
    <ProdShell
      userName={user?.email || "Usuario"}
      establishmentName={establishmentName || "Mi Negocio"}
    >
      <PlannerContent redirectAfterSave="/dashboard/insumos" />
    </ProdShell>
  );
}
