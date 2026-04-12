"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { InventoryPlanner } from "@/components/inventory-planner";
import { useLanguage } from "@/hooks/use-language";
import type { SupplyPlan, PlanPeriod } from "@/lib/default-supplies";

interface PlannerContentProps {
  /** Path to navigate to after a save attempt (success or fallback). */
  redirectAfterSave: string;
  /** Optional wrapper className applied around InventoryPlanner. */
  wrapperClassName?: string;
}

export function PlannerContent({
  redirectAfterSave,
  wrapperClassName,
}: PlannerContentProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const [, setSaving] = useState(false);

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

      router.push(redirectAfterSave);
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
      router.push(redirectAfterSave);
    } finally {
      setSaving(false);
    }
  };

  const planner = <InventoryPlanner onComplete={handlePlanComplete} />;

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{planner}</div>;
  }

  return planner;
}
