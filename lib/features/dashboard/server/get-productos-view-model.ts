import { getDashboardContextOrRedirect } from "./get-dashboard-context";

export async function getProductosViewModel() {
  const { supabase, user, establishment } = await getDashboardContextOrRedirect();

  // Keep current contract expected by ProductsPageClient.
  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      product_ingredients (
        id,
        quantity_needed,
        supply_id,
        supplies (
          id,
          name,
          unit
        )
      )
    `
    )
    .eq("establishment_id", establishment.id)
    .order("created_at", { ascending: false });

  const { data: supplies } = await supabase
    .from("supplies")
    .select("id, name, unit, current_quantity")
    .eq("establishment_id", establishment.id)
    .order("name");

  return {
    userName: user.email || "",
    establishmentName: establishment.name,
    establishmentId: establishment.id,
    products: products || [],
    supplies: supplies || [],
  };
}
