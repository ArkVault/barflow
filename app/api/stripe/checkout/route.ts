import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
     try {
          const { priceId, userId, userEmail, establishmentId } = await req.json();

          if (!priceId || !userId) {
               return NextResponse.json(
                    { error: 'Missing required parameters' },
                    { status: 400 }
               );
          }

          // Authenticate the request
          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (!user || user.id !== userId) {
               return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
               );
          }

          // Resolve establishment — by ID or by user
          let resolvedEstablishmentId = establishmentId;
          let customerId: string | null = null;

          if (establishmentId) {
               const { data: establishment } = await supabase
                    .from('establishments')
                    .select('stripe_customer_id')
                    .eq('id', establishmentId)
                    .eq('user_id', user.id)
                    .single();
               if (!establishment) {
                    return NextResponse.json(
                         { error: 'Establishment not found for user' },
                         { status: 403 }
                    );
               }
               customerId = establishment?.stripe_customer_id ?? null;
          } else {
               const { data: establishment } = await supabase
                    .from('establishments')
                    .select('id, stripe_customer_id')
                    .eq('user_id', userId)
                    .single();
               customerId = establishment?.stripe_customer_id ?? null;
               resolvedEstablishmentId = establishment?.id;
          }

          // Create Stripe customer if doesn't exist
          if (!customerId) {
               const customer = await getStripe().customers.create({
                    email: userEmail || user.email,
                    metadata: {
                         user_id: userId,
                         establishment_id: resolvedEstablishmentId || '',
                    },
               });
               customerId = customer.id;

               // Save customer ID to database
               if (resolvedEstablishmentId) {
                    await supabase
                         .from('establishments')
                         .update({ stripe_customer_id: customerId })
                         .eq('id', resolvedEstablishmentId);
               }
          }

          // Create Checkout Session
          const session = await getStripe().checkout.sessions.create({
               customer: customerId,
               mode: 'subscription',
               payment_method_types: ['card'],
               line_items: [
                    {
                         price: priceId,
                         quantity: 1,
                    },
               ],
               success_url: STRIPE_CONFIG.successUrl,
               cancel_url: STRIPE_CONFIG.cancelUrl,
               metadata: {
                    user_id: userId,
                    establishment_id: resolvedEstablishmentId || '',
               },
               subscription_data: {
                    metadata: {
                         user_id: userId,
                         establishment_id: resolvedEstablishmentId || '',
                    },
               },
          });

          return NextResponse.json({ sessionId: session.id, url: session.url });
     } catch (error: any) {
          console.error('Error creating checkout session:', error);
          return NextResponse.json(
               { error: error.message || 'Error creating checkout session' },
               { status: 500 }
          );
     }
}
