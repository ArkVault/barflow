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
      <div className="px-6 md:px-8 lg:px-10 py-6 md:py-8 max-w-5xl mx-auto">
        <ProductosContent />
      </div>
    </ProdShell>
  );
}
