"use client";

import { ProdShell } from "@/components/shells";
import { ProductosContent } from "@/components/productos-content";
import { useAuth } from "@/contexts/auth-context";

export default function ProductosPage() {
  const { user, establishmentName } = useAuth();
  return (
    <ProdShell
      userName={user?.email || "Usuario"}
      establishmentName={establishmentName || "Mi Negocio"}
    >
      <div className="p-6 max-w-5xl mx-auto">
        <ProductosContent />
      </div>
    </ProdShell>
  );
}
