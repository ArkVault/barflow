import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardStats } from "@/types/dashboard";

export const DashboardStatsService = {
  async getByUserId(supabase: SupabaseClient<any>, userId: string): Promise<DashboardStats> {
    const { data: establishment } = await supabase
      .from("establishments")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!establishment) {
      return {
        totalProducts: 0,
        lowStockCount: 0,
        totalSalesToday: 0,
        monthlyRevenue: 0,
      };
    }

    const { count: totalProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("establishment_id", establishment.id);

    const { count: lowStockCount } = await supabase
      .from("supplies")
      .select("*", { count: "exact", head: true })
      .eq("establishment_id", establishment.id)
      .lt("current_quantity", "min_threshold");

    const today = new Date().toISOString().split("T")[0];
    const { data: salesToday } = await supabase
      .from("sales")
      .select("total_price")
      .eq("establishment_id", establishment.id)
      .gte("created_at", today);

    const totalSalesToday = (salesToday || []).reduce(
      (sum: number, sale: { total_price: number }) => sum + (sale.total_price || 0),
      0
    );

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: salesMonth } = await supabase
      .from("sales")
      .select("total_price")
      .eq("establishment_id", establishment.id)
      .gte("created_at", startOfMonth.toISOString());

    const monthlyRevenue = (salesMonth || []).reduce(
      (sum: number, sale: { total_price: number }) => sum + (sale.total_price || 0),
      0
    );

    return {
      totalProducts: totalProducts || 0,
      lowStockCount: lowStockCount || 0,
      totalSalesToday,
      monthlyRevenue,
    };
  },
};
