import { SuppliesService } from "@/lib/services/supplies.service";
import { getDashboardContextOrRedirect } from "./get-dashboard-context";

export async function getInsumosViewModel() {
  const { supabase, user, establishment } = await getDashboardContextOrRedirect();
  const { data: supplies } = await SuppliesService.getAll(supabase, establishment.id, {
    orderBy: "created_at",
    ascending: false,
  });

  return {
    userName: user.email || "",
    establishmentName: establishment.name,
    establishmentId: establishment.id,
    supplies: supplies || [],
  };
}
