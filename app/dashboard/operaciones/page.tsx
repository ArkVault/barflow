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
      <div className="px-6 md:px-8 lg:px-10 py-6 md:py-8 max-w-[1400px] mx-auto">
        <OperacionesContent />
      </div>
    </ProdShell>
  );
}
