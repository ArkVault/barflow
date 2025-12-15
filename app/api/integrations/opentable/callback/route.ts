import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { encryptToken, generateWebhookSecret } from '@/lib/encryption';

/**
 * OAuth callback handler
 * Exchanges authorization code for access tokens and sets up webhook
 */
export async function GET(req: NextRequest) {
     const { searchParams } = new URL(req.url);
     const code = searchParams.get('code');
     const state = searchParams.get('state'); // establishment_id
     const error = searchParams.get('error');

     // Handle OAuth errors
     if (error) {
          console.error('OpenTable OAuth error:', error);
          return redirect(`/dashboard/configuracion?error=oauth_${error}`);
     }

     if (!code || !state) {
          return redirect('/dashboard/configuracion?error=invalid_callback');
     }

     try {
          const supabase = await createClient();

          // 1. Exchange authorization code for tokens
          const tokenResponse = await fetch(
               process.env.OPENTABLE_TOKEN_URL || 'https://oauth.opentable.com/token',
               {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                         grant_type: 'authorization_code',
                         code,
                         client_id: process.env.OPENTABLE_CLIENT_ID!,
                         client_secret: process.env.OPENTABLE_CLIENT_SECRET!,
                         redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/opentable/callback`,
                    }),
               }
          );

          if (!tokenResponse.ok) {
               const errorData = await tokenResponse.text();
               console.error('Token exchange failed:', errorData);
               throw new Error('Failed to exchange authorization code');
          }

          const tokens = await tokenResponse.json();
          console.log('Tokens received successfully');

          // 2. Fetch restaurant information
          const restaurantResponse = await fetch(
               `${process.env.OPENTABLE_API_URL || 'https://api.opentable.com'}/v1/restaurant/me`,
               {
                    headers: { Authorization: `Bearer ${tokens.access_token}` },
               }
          );

          if (!restaurantResponse.ok) {
               throw new Error('Failed to fetch restaurant information');
          }

          const restaurant = await restaurantResponse.json();
          console.log('Restaurant info:', restaurant.name);

          // 3. Create webhook for this establishment
          const webhookSecret = generateWebhookSecret();
          const webhook = await createOpenTableWebhook(
               tokens.access_token,
               state, // establishment_id
               webhookSecret
          );

          console.log('Webhook created:', webhook.id);

          // 4. Encrypt and store credentials
          const encryptedAccessToken = await encryptToken(tokens.access_token);
          const encryptedRefreshToken = await encryptToken(tokens.refresh_token);

          const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

          const { error: dbError } = await supabase
               .from('opentable_integrations')
               .upsert({
                    establishment_id: state,
                    access_token: encryptedAccessToken,
                    refresh_token: encryptedRefreshToken,
                    token_expires_at: expiresAt.toISOString(),
                    opentable_restaurant_id: restaurant.id,
                    opentable_restaurant_name: restaurant.name,
                    webhook_id: webhook.id,
                    webhook_secret: webhookSecret,
                    is_active: true,
                    last_sync_at: new Date().toISOString(),
               }, {
                    onConflict: 'establishment_id'
               });

          if (dbError) {
               console.error('Database error:', dbError);
               throw dbError;
          }

          console.log('Integration saved successfully');
          return redirect('/dashboard/configuracion?success=opentable_connected');

     } catch (error) {
          console.error('OpenTable callback error:', error);
          return redirect('/dashboard/configuracion?error=setup_failed');
     }
}

/**
 * Create webhook in OpenTable for this establishment
 */
async function createOpenTableWebhook(
     accessToken: string,
     establishmentId: string,
     secret: string
): Promise<{ id: string }> {
     const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/opentable/${establishmentId}`;

     const response = await fetch(
          `${process.env.OPENTABLE_API_URL || 'https://api.opentable.com'}/v1/webhooks`,
          {
               method: 'POST',
               headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
               },
               body: JSON.stringify({
                    url: webhookUrl,
                    events: [
                         'reservation.created',
                         'reservation.updated',
                         'reservation.cancelled',
                         'reservation.seated',
                         'reservation.completed',
                    ],
                    secret,
                    active: true,
               }),
          }
     );

     if (!response.ok) {
          const errorData = await response.text();
          console.error('Webhook creation failed:', errorData);
          throw new Error('Failed to create webhook');
     }

     return await response.json();
}
