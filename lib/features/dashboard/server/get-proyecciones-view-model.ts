import { getDashboardContextOrRedirect } from "./get-dashboard-context";

export async function getProyeccionesViewModel() {
  const { supabase, user, establishment } = await getDashboardContextOrRedirect();

  const { data: supplies } = await supabase
    .from("supplies")
    .select("*")
    .eq("establishment_id", establishment.id)
    .order("name");

  const { data: sales } = await supabase
    .from("sales")
    .select(
      `
      *,
      products (
        product_ingredients (
          supply_id,
          quantity_needed
        )
      )
    `
    )
    .eq("establishment_id", establishment.id)
    .order("sale_date", { ascending: false });

  return {
    userName: user.email || "",
    establishmentName: establishment.name,
    establishmentId: establishment.id,
    supplies: supplies || [],
    sales: sales || [],
  };
}
