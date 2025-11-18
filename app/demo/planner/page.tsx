"use client";

import { useRouter } from "next/navigation";
import { InventoryPlanner } from "@/components/inventory-planner";
import { DemoSidebar } from "@/components/demo-sidebar";
import type { SupplyPlan, PlanPeriod } from "@/lib/default-supplies";

export default function PlannerPage() {
  const router = useRouter();

  const handlePlanComplete = (supplies: SupplyPlan[], period: PlanPeriod) => {
    // Store the plan in localStorage for demo purposes
    if (typeof window !== "undefined") {
      localStorage.setItem("barflow_plan", JSON.stringify({ supplies, period }));
    }
    
    // Redirect to demo dashboard
    router.push("/demo");
  };

  return (
    <>
      <DemoSidebar />
      <InventoryPlanner onComplete={handlePlanComplete} />
    </>
  );
}
