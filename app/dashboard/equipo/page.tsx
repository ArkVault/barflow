"use client";

import { useAuth } from "@/contexts/auth-context";
import { ProdShell } from "@/components/shells";
import TeamManagement from "@/components/team/team-management";

export default function EquipoPage() {
  const { user, establishmentName } = useAuth();

  return (
    <ProdShell
      userName={user?.email || "Usuario"}
      establishmentName={establishmentName || "Mi Negocio"}
    >
      <TeamManagement />
    </ProdShell>
  );
}
