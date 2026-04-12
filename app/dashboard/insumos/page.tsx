"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ProdShell } from "@/components/shells";
import { InsumosContent } from "@/components/insumos-content";
import { useAuth } from "@/contexts/auth-context";

function InsumosPageInner() {
  const { user, establishmentName } = useAuth();
  return (
    <ProdShell
      userName={user?.email || "Usuario"}
      establishmentName={establishmentName || "Mi Negocio"}
    >
      <div className="p-6 max-w-5xl mx-auto">
        <InsumosContent
          plannerHref="/dashboard/planner"
          restockCleanupUrl="/dashboard/insumos"
        />
      </div>
    </ProdShell>
  );
}

export default function InsumosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <InsumosPageInner />
    </Suspense>
  );
}
