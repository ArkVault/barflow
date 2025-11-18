"use client";

import { useRouter } from "next/navigation";
import { InventoryPlanner } from "@/components/inventory-planner";
import { DashboardLayout } from "@/components/dashboard-layout";
import type { SupplyPlan, PlanPeriod } from "@/lib/default-supplies";

interface PlannerClientProps {
  userName: string;
  establishmentName: string;
}

export function PlannerClient({ userName, establishmentName }: PlannerClientProps) {
  const router = useRouter();

  const handlePlanComplete = async (supplies: SupplyPlan[], period: PlanPeriod) => {
    // Store the plan in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("barflow_plan", JSON.stringify({ supplies, period }));
    }
    
    // TODO: In production, save to Supabase database
    // For now, just redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <DashboardLayout userName={userName} establishmentName={establishmentName}>
      <div className="p-6">
        <InventoryPlanner onComplete={handlePlanComplete} />
      </div>
    </DashboardLayout>
  );
}
