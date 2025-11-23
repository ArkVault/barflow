"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InventoryPlanner } from "@/components/inventory-planner";
import { DemoSidebar } from "@/components/demo-sidebar";
import type { SupplyPlan, PlanPeriod } from "@/lib/default-supplies";
import { toast } from "sonner";

export default function PlannerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handlePlanComplete = async (supplies: SupplyPlan[], period: PlanPeriod) => {
    setSaving(true);

    try {
      // Save to Supabase
      const response = await fetch('/api/save-supplies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supplies, period }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If authentication required or error, fallback to localStorage
        if (response.status === 401) {
          console.warn('No authentication - saving locally only');
          if (typeof window !== "undefined") {
            localStorage.setItem("barflow_plan", JSON.stringify({ supplies, period }));
          }
          toast.warning('Plan guardado localmente. Inicia sesión para sincronizar con la base de datos.');
        } else {
          throw new Error(data.error || 'Error saving plan');
        }
      } else {
        // Successfully saved to database
        toast.success(data.message || `Plan guardado: ${data.inserted} nuevos, ${data.updated} actualizados`);

        // Also save to localStorage as backup
        if (typeof window !== "undefined") {
          localStorage.setItem("barflow_plan", JSON.stringify({ supplies, period }));
        }
      }

      // Redirect to demo dashboard
      router.push("/demo");

    } catch (error) {
      console.error('Error saving plan:', error);

      // Fallback to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("barflow_plan", JSON.stringify({ supplies, period }));
      }

      toast.error('Error al guardar en la base de datos. Se guardó localmente.');
      router.push("/demo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DemoSidebar />
      <InventoryPlanner onComplete={handlePlanComplete} />
    </>
  );
}
