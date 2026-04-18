"use client";

import { PeriodProvider } from "@/contexts/period-context";
import { ProdShell } from "@/components/shells";
import { HomeContent } from "@/components/home-content";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardPage() {
  const { user, establishmentName } = useAuth();
  return (
    <PeriodProvider>
      <ProdShell
        userName={user?.email || "Usuario"}
        establishmentName={establishmentName || "Mi Negocio"}
      >
        <div className="px-6 md:px-8 lg:px-10 py-6 md:py-8 max-w-5xl mx-auto">
          <HomeContent
            insumosHref="/dashboard/insumos"
            productosHref="/dashboard/productos"
            plannerRedirect="/dashboard/planner"
          />
        </div>
      </ProdShell>
    </PeriodProvider>
  );
}
