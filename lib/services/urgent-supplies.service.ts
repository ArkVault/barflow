import type { SupabaseClient } from "@supabase/supabase-js";
import type { UrgentSupply, UrgentSupplyProduct, UrgencyPeriod } from "@/types/dashboard";
import {
  calculateDaysUntilDepleted,
  calculateUrgencyLevel,
} from "@/lib/utils/urgency-calculations";

type SupplyRow = {
  id: string;
  name: string;
  current_quantity: number;
  unit: string;
  min_threshold: number;
  category: string;
};

type IngredientRow = {
  quantity_needed: number;
  products: {
    name: string;
    category: string;
    price: number;
  };
};

export const UrgentSuppliesService = {
  async getByUserId(
    supabase: SupabaseClient<any>,
    userId: string,
    period: UrgencyPeriod
  ): Promise<UrgentSupply[]> {
    const { data: establishment } = await supabase
      .from("establishments")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!establishment) return [];

    const { data: supplies } = await supabase
      .from("supplies")
      .select(
        `
        id,
        name,
        current_quantity,
        unit,
        min_threshold,
        category
      `
      )
      .eq("establishment_id", establishment.id)
      .lt("current_quantity", "min_threshold")
      .order("current_quantity", { ascending: true });

    if (!supplies || supplies.length === 0) return [];

    const urgentSupplies = await Promise.all(
      (supplies as SupplyRow[]).map(async (supply) => {
        const { data: ingredients } = await supabase
          .from("product_ingredients")
          .select(
            `
            quantity_needed,
            products (
              name,
              category,
              price
            )
          `
          )
          .eq("supply_id", supply.id);

        const products: UrgentSupplyProduct[] = ((ingredients || []) as IngredientRow[]).map((ing) => ({
          name: ing.products.name,
          category: ing.products.category,
          quantityNeeded: ing.quantity_needed,
        }));

        const daysUntilDepleted = calculateDaysUntilDepleted(
          supply.current_quantity,
          supply.min_threshold
        );

        const urgencyLevel = calculateUrgencyLevel(daysUntilDepleted, period);

        return {
          ...supply,
          products,
          daysUntilDepleted,
          urgencyLevel,
        } as UrgentSupply;
      })
    );

    return urgentSupplies;
  },
};
