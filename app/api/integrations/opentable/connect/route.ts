import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

/**
 * Initiate OpenTable OAuth flow
 * Redirects user to OpenTable authorization page
 */
export async function GET(req: NextRequest) {
     try {
          const supabase = await createClient();

          // Get authenticated user
          const { data: { user }, error: authError } = await supabase.auth.getUser();

          if (authError || !user) {
               return redirect('/auth/login?error=unauthorized');
          }

          // Get user's establishment
          const { data: establishment, error: estError } = await supabase
               .from('establishments')
               .select('id, name')
               .eq('user_id', user.id)
               .single();

          if (estError || !establishment) {
               return redirect('/dashboard/configuracion?error=no_establishment');
          }

          // Check if already connected
          const { data: existing } = await supabase
               .from('opentable_integrations')
               .select('id, is_active')
               .eq('establishment_id', establishment.id)
               .single();

          if (existing?.is_active) {
               return redirect('/dashboard/configuracion?info=already_connected');
          }

          // Build OAuth authorization URL
          const baseUrl = process.env.OPENTABLE_OAUTH_URL || 'https://oauth.opentable.com';
          const params = new URLSearchParams({
               client_id: process.env.OPENTABLE_CLIENT_ID || '',
               redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/opentable/callback`,
               response_type: 'code',
               scope: 'reservations:read reservations:write webhooks:manage restaurant:read',
               state: establishment.id, // Pass establishment ID to callback
          });

          const authUrl = `${baseUrl}/authorize?${params.toString()}`;

          console.log('Redirecting to OpenTable OAuth:', authUrl);
          return redirect(authUrl);

     } catch (error) {
          console.error('OpenTable connect error:', error);
          return redirect('/dashboard/configuracion?error=connection_failed');
     }
}
