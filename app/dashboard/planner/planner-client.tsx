"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InventoryPlanner } from "@/components/inventory-planner";
import { ProdShell } from "@/components/shells";
import type { SupplyPlan, PlanPeriod } from "@/lib/default-supplies";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/use-language";

interface PlannerClientProps {
  userName: string;
  establishmentName: string;
}

export function PlannerClient({
  userName,
  establishmentName,
}: PlannerClientProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const [saving, setSaving] = useState(false);

  const handlePlanComplete = async (
    supplies: SupplyPlan[],
    period: PlanPeriod,
  ) => {
    setSaving(true);

    try {
      const response = await fetch("/api/save-supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplies, period }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          console.warn("No authentication - saving locally only");
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "barflow_plan",
              JSON.stringify({ supplies, period }),
            );
          }
          toast.warning(
            language === "es"
              ? "Plan guardado localmente. Inicia sesión para sincronizar con la base de datos."
              : "Plan saved locally. Log in to sync with the database.",
          );
        } else {
          throw new Error(data.error || "Error saving plan");
        }
      } else {
        const successMsg =
          language === "es"
            ? `Plan guardado: ${data.inserted} nuevos, ${data.updated} actualizados`
            : `Plan saved: ${data.inserted} new, ${data.updated} updated`;
        toast.success(data.message || successMsg);

        if (typeof window !== "undefined") {
          localStorage.setItem(
            "barflow_plan",
            JSON.stringify({ supplies, period }),
          );
        }
      }

      router.push("/dashboard/insumos");
    } catch (error) {
      console.error("Error saving plan:", error);

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "barflow_plan",
          JSON.stringify({ supplies, period }),
        );
      }

      toast.error(
        language === "es"
          ? "Error al guardar en la base de datos. Se guardó localmente."
          : "Error saving to database. Saved locally.",
      );
      router.push("/dashboard/insumos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProdShell userName={userName} establishmentName={establishmentName}>
      <InventoryPlanner onComplete={handlePlanComplete} />
    </ProdShell>
  );
}
