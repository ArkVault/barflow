import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
     try {
          const { priceId, userId } = await req.json();

          if (!priceId || !userId) {
               return NextResponse.json(
                    { error: 'Missing required parameters' },
                    { status: 400 }
               );
          }

          // Get user's email from Supabase
          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (!user || user.id !== userId) {
               return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
               );
          }

          // Get or create Stripe customer
          const { data: establishment } = await supabase
               .from('establishments')
               .select('stripe_customer_id')
               .eq('user_id', userId)
               .single();

          let customerId = establishment?.stripe_customer_id;

          if (!customerId) {
               // Create new Stripe customer
               const customer = await getStripe().customers.create({
                    email: user.email,
                    metadata: {
                         supabase_user_id: userId,
                    },
               });

               customerId = customer.id;

               // Save customer ID to database
               await supabase
                    .from('establishments')
                    .update({ stripe_customer_id: customerId })
                    .eq('user_id', userId);
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
               },
               subscription_data: {
                    metadata: {
                         user_id: userId,
                    },
               },
          });

          return NextResponse.json({ sessionId: session.id, url: session.url });
     } catch (error: any) {
          console.error('Error creating checkout session:', error);
          return NextResponse.json(
               { error: error.message },
               { status: 500 }
          );
     }
}
