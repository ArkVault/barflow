"use client";

import { ProdShell } from "@/components/shells";
import { OperacionesContent } from "@/components/operaciones-content";
import { useAuth } from "@/contexts/auth-context";

export default function OperacionesPage() {
  const { user, establishmentName } = useAuth();
  return (
    <ProdShell
      userName={user?.email || "Usuario"}
      establishmentName={establishmentName || "Mi Negocio"}
    >
      <div className="p-6 max-w-[1400px] mx-auto">
        <OperacionesContent />
      </div>
    </ProdShell>
  );
}
