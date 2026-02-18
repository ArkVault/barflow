import { SupabaseClient } from '@supabase/supabase-js';
import { Supply } from '@/types';

type SuppliesOrderBy = 'name' | 'created_at';

export const SuppliesService = {
     /**
      * Get all supplies for an establishment
      */
     async getAll(
          supabase: SupabaseClient<any>,
          establishmentId: string,
          options: { orderBy?: SuppliesOrderBy; ascending?: boolean } = {}
     ) {
          const orderBy = options.orderBy ?? 'name';
          const ascending = options.ascending ?? true;

          return supabase
               .from('supplies')
               .select('*')
               .eq('establishment_id', establishmentId)
               .order(orderBy, { ascending });
     },

     /**
      * Get urgent supplies (low stock)
      */
     async getLowStock(supabase: SupabaseClient<any>, establishmentId: string) {
          const { data, error } = await supabase
               .from('supplies')
               .select('*')
               .eq('establishment_id', establishmentId);

          if (error) return { data: null, error };

          // Filter in application layer because typical Supabase clients don't support column comparison (col1 < col2) directly
          const lowStock = (data || []).filter((item: any) => item.current_quantity < item.min_threshold);
          return { data: lowStock, error: null };
     },

     async getById(supabase: SupabaseClient<any>, id: string) {
          return supabase
               .from('supplies')
               .select('*')
               .eq('id', id)
               .single();
     },

     /**
      * Create a new supply
      */
     async create(supabase: SupabaseClient<any>, supply: Partial<Supply>) {
          return supabase
               .from('supplies')
               .insert(supply)
               .select()
               .single();
     },

     /**
      * Update a supply
      */
     async update(supabase: SupabaseClient<any>, id: string, updates: Partial<Supply>) {
          return supabase
               .from('supplies')
               .update(updates)
               .eq('id', id)
               .select()
               .single();
     },

     /**
      * Delete a supply
      */
     async delete(supabase: SupabaseClient<any>, id: string) {
          return supabase
               .from('supplies')
               .delete()
               .eq('id', id);
     },

     /**
      * Batch update or insert
      */
     async upsertBatch(supabase: SupabaseClient<any>, supplies: Partial<Supply>[]) {
          return supabase
               .from('supplies')
               .upsert(supplies)
               .select();
     }
};
