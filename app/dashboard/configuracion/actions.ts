'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function updateEstablishmentSettings(
     establishmentId: string,
     settings: { name?: string; taxRate?: number }
) {
     const cookieStore = await cookies();
     const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
               cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                         cookiesToSet.forEach(({ name, value, options }) =>
                              cookieStore.set(name, value, options)
                         );
                    },
               },
          }
     );

     const { data: { user }, error: authError } = await supabase.auth.getUser();
     if (authError || !user) {
          return { success: false, error: 'No autenticado' };
     }

     const updates: Record<string, unknown> = {};
     if (settings.name !== undefined) updates.name = settings.name.trim();
     if (settings.taxRate !== undefined) {
          const rate = Number(settings.taxRate);
          if (isNaN(rate) || rate < 0 || rate > 100) {
               return { success: false, error: 'La tasa de impuesto debe estar entre 0 y 100' };
          }
          updates.tax_rate = rate;
     }

     if (Object.keys(updates).length === 0) {
          return { success: true };
     }

     const { error } = await supabase
          .from('establishments')
          .update(updates)
          .eq('id', establishmentId)
          .eq('user_id', user.id); // RLS double-check

     if (error) {
          console.error('Error updating establishment settings:', error.message);
          return { success: false, error: 'Error al guardar los cambios' };
     }

     revalidatePath('/dashboard/configuracion');
     return { success: true };
}
