import { SupabaseClient } from '@supabase/supabase-js';
import { MenuData } from '@/types';

export const MenusService = {
     /**
      * Get all menus for an establishment
      */
     async getAll(supabase: SupabaseClient<any>, establishmentId: string) {
          return supabase
               .from('menus')
               .select('*')
               .eq('establishment_id', establishmentId)
               .order('name');
     },

     /**
      * Get active menus (primary or secondary)
      */
     async getActive(supabase: SupabaseClient<any>, establishmentId?: string) {
          let query = supabase
               .from('menus')
               .select('id, name, is_active, is_secondary_active')
               .or('is_active.eq.true,is_secondary_active.eq.true');

          if (establishmentId) {
               query = query.eq('establishment_id', establishmentId);
          }

          return query;
     },

     async create(supabase: SupabaseClient<any>, menu: Partial<MenuData>) {
          return supabase
               .from('menus')
               .insert(menu)
               .select()
               .single();
     },

     async update(supabase: SupabaseClient<any>, id: string, updates: Partial<MenuData>) {
          return supabase
               .from('menus')
               .update(updates)
               .eq('id', id)
               .select()
               .single();
     },

     async delete(supabase: SupabaseClient<any>, id: string) {
          return supabase
               .from('menus')
               .delete()
               .eq('id', id);
     },

     /**
      * Set a menu as active (and potentially deactivate others if the logic requires single active menu)
      */
     async setActive(supabase: SupabaseClient<any>, establishmentId: string, menuId: string, isActive: boolean) {
          return this.update(supabase, menuId, { is_active: isActive });
     }
};
