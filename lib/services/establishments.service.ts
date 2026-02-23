import { SupabaseClient } from '@supabase/supabase-js';

type Establishment = any; // Fallback since we don't have generated types yet

export const EstablishmentsService = {
     /**
      * Get establishment by ID
      */
     async getById(supabase: SupabaseClient<any>, id: string) {
          return supabase
               .from('establishments')
               .select('*')
               .eq('id', id)
               .single();
     },

     /**
      * Get establishment by User ID
      * This is commonly used to find which establishment belongs to the logged-in user
      */
     async getByUserId(supabase: SupabaseClient<any>, userId: string) {
          // First try to find one where the user is the owner
          const { data, error } = await supabase
               .from('establishments')
               .select('*')
               .eq('user_id', userId)
               .single();

          // TODO: In the future, check for team memberships if owner check fails

          return { data, error };
     },

     /**
      * Update establishment details
      */
     async update(supabase: SupabaseClient<any>, id: string, updates: Partial<Establishment>) {
          return supabase
               .from('establishments')
               .update(updates)
               .eq('id', id)
               .select()
               .single();
     },

     /**
      * Create a new establishment
      */
     async create(supabase: SupabaseClient<any>, establishment: Partial<Establishment>) {
          return supabase
               .from('establishments')
               .insert(establishment)
               .select()
               .single();
     }
};
