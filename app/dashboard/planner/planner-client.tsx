"use client";

import { useRouter } from "next/navigation";
import { InventoryPlanner } from "@/components/inventory-planner";
import { ProdShell } from "@/components/shells";
import type { SupplyPlan, PlanPeriod } from "@/lib/default-supplies";

interface PlannerClientProps {
  userName: string;
  establishmentName: string;
}

export function PlannerClient({
  userName,
  establishmentName,
}: PlannerClientProps) {
  const router = useRouter();

  const handlePlanComplete = async (
    supplies: SupplyPlan[],
    period: PlanPeriod,
  ) => {
    // Store the plan in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "barflow_plan",
        JSON.stringify({ supplies, period }),
      );
    }

    // TODO: In production, save to Supabase database
    // For now, just redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <ProdShell userName={userName} establishmentName={establishmentName}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Planner de Inventario</h1>
          <p className="text-muted-foreground">
            Configura tu plan de inventario inicial
          </p>
        </div>
        <InventoryPlanner onComplete={handlePlanComplete} />
      </div>
    </ProdShell>
  );
}
