import { SupabaseClient } from '@supabase/supabase-js';
// Sales Service for handling transactions

export const SalesService = {
     /**
      * Record a new sale (and typically trigger inventory deduction via Postgres triggers or separate logic)
      */
     async createSale(supabase: SupabaseClient<any>, saleData: {
          establishment_id: string;
          total_price: number;
          payment_method: string;
          products: any; // JSONB
          created_at?: string;
     }) {
          return supabase
               .from('sales')
               .insert(saleData)
               .select()
               .single();
     },

     /**
      * Get sales for a specific date range
      */
     async getSalesByDateRange(
          supabase: SupabaseClient<any>,
          establishmentId: string,
          startDate: string,
          endDate: string
     ) {
          return supabase
               .from('sales')
               .select('*')
               .eq('establishment_id', establishmentId)
               .gte('created_at', startDate)
               .lte('created_at', endDate)
               .order('created_at', { ascending: false });
     },

     /**
      * Get daily sales summary (this logic is often calculated client side or via RPC)
      * returning raw rows for now
      */
     async getDailySales(supabase: SupabaseClient<any>, establishmentId: string, date: string) {
          // date should be YYYY-MM-DD
          const start = `${date}T00:00:00`;
          const end = `${date}T23:59:59`;
          return this.getSalesByDateRange(supabase, establishmentId, start, end);
     },

     /**
      * Get recent sales rows used for dashboard top products.
      */
     async getRecentForDashboard(supabase: SupabaseClient<any>, establishmentId: string, sinceIso: string) {
          return supabase
               .from('sales')
               .select('id, items, total, created_at')
               .eq('establishment_id', establishmentId)
               .gte('created_at', sinceIso);
     },
};
