import { SupabaseClient } from '@supabase/supabase-js';
import { Product } from '@/types';

export const ProductsService = {
     /**
      * Get all products for an establishment, including ingredients
      */
     async getAll(supabase: SupabaseClient<any>, establishmentId: string) {
          return supabase
               .from('products')
               .select(`
        *,
        product_ingredients (
          *,
          supply:supplies (*)
        )
      `)
               .eq('establishment_id', establishmentId)
               .order('name');
     },

     /**
      * Get active products by Menu IDs
      */
     async getByMenuIds(supabase: SupabaseClient<any>, menuIds: string[]) {
          return supabase
               .from('products')
               .select('id, name, price, category, menu_id, image_url')
               .in('menu_id', menuIds)
               .eq('is_active', true);
     },

     /**
      * Get active products for dashboard/demo summary cards
      */
     async getActiveDashboardProductsByMenuIds(supabase: SupabaseClient<any>, menuIds: string[]) {
          return supabase
               .from('products')
               .select('id, name, updated_at, menu_id')
               .in('menu_id', menuIds)
               .eq('is_active', true)
               .order('updated_at', { ascending: false });
     },

     /**
      * Get products by Menu ID
      */
     async getByMenuId(supabase: SupabaseClient<any>, establishmentId: string, menuId: string) {
          return supabase
               .from('products')
               .select(`
        *,
        product_ingredients (
          *,
          supply:supplies (*)
        )
      `)
               .eq('establishment_id', establishmentId)
               .eq('menu_id', menuId)
               .order('name');
     },

     async getById(supabase: SupabaseClient<any>, id: string) {
          return supabase
               .from('products')
               .select(`
        *,
        product_ingredients (
          *,
          supply:supplies (*)
        )
      `)
               .eq('id', id)
               .single();
     },

     async create(supabase: SupabaseClient<any>, product: Partial<Product>) {
          return supabase
               .from('products')
               .insert(product)
               .select()
               .single();
     },

     async update(supabase: SupabaseClient<any>, id: string, updates: Partial<Product>) {
          return supabase
               .from('products')
               .update(updates)
               .eq('id', id)
               .select()
               .single();
     },

     async delete(supabase: SupabaseClient<any>, id: string) {
          return supabase
               .from('products')
               .delete()
               .eq('id', id);
     }
};
