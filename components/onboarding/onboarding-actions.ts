"use server";

import { createClient } from "@/lib/supabase/server";

interface OnboardingData {
  establishmentId: string;
  establishmentName: string;
  roles: {
    meseros: number;
    jefeDeBarra: number;
    pisoGerente: number;
    admin: number;
  };
  branchType: "single" | "multiple";
  inventoryMethod: "excel" | "manual";
}

export async function saveOnboardingData(data: OnboardingData) {
  const supabase = await createClient();

  // Verify the user owns this establishment
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error: estError } = await supabase
    .from("establishments")
    .select("id")
    .eq("id", data.establishmentId)
    .eq("user_id", user.id)
    .single();

  if (estError) throw new Error("Establecimiento no encontrado");

  // Update establishment with onboarding data
  const { error: updateError } = await supabase
    .from("establishments")
    .update({
      name: data.establishmentName,
      onboarding_completed: true,
      onboarding_data: {
        roles: data.roles,
        branchType: data.branchType,
        inventoryMethod: data.inventoryMethod,
        completedAt: new Date().toISOString(),
      },
    })
    .eq("id", data.establishmentId);

  if (updateError) {
    console.error("Error saving onboarding data:", updateError);
    throw new Error("Error al guardar datos de onboarding");
  }

  return { success: true };
}
