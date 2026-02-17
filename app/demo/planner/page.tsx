"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InventoryPlanner } from "@/components/inventory-planner";
import { DemoSidebar } from "@/components/demo-sidebar";
import type { SupplyPlan, PlanPeriod } from "@/lib/default-supplies";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/use-language";

export default function PlannerPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
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
          toast.warning(language === 'es'
            ? 'Plan guardado localmente. Inicia sesión para sincronizar con la base de datos.'
            : 'Plan saved locally. Log in to sync with the database.');
        } else {
          throw new Error(data.error || 'Error saving plan');
        }
      } else {
        // Successfully saved to database
        const successMsg = language === 'es'
          ? `Plan guardado: ${data.inserted} nuevos, ${data.updated} actualizados`
          : `Plan saved: ${data.inserted} new, ${data.updated} updated`;
        toast.success(data.message || successMsg);

        // Also save to localStorage as backup
        if (typeof window !== "undefined") {
          localStorage.setItem("barflow_plan", JSON.stringify({ supplies, period }));
        }
      }

      // Redirect to Insumos page
      router.push("/demo/insumos");

    } catch (error) {
      console.error('Error saving plan:', error);

      // Fallback to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("barflow_plan", JSON.stringify({ supplies, period }));
      }

      toast.error(language === 'es'
        ? 'Error al guardar en la base de datos. Se guardó localmente.'
        : 'Error saving to database. Saved locally.');
      router.push("/demo/insumos");
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
