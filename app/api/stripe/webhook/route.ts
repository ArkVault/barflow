import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
     try {
          const body = await req.text();
          const signature = req.headers.get('stripe-signature')!;

          let event: Stripe.Event;

          try {
               event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
          } catch (err: any) {
               console.error('Webhook signature verification failed:', err.message);
               return NextResponse.json(
                    { error: 'Webhook signature verification failed' },
                    { status: 400 }
               );
          }

          const supabase = await createClient();

          // Handle the event
          switch (event.type) {
               case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session;
                    const userId = session.metadata?.user_id;

                    if (userId && session.subscription) {
                         // Update establishment with subscription info
                         await supabase
                              .from('establishments')
                              .update({
                                   stripe_subscription_id: session.subscription as string,
                                   subscription_status: 'active',
                                   plan_type: session.mode === 'subscription' ? 'monthly' : 'yearly',
                              })
                              .eq('user_id', userId);
                    }
                    break;
               }

               case 'customer.subscription.updated': {
                    const subscription = event.data.object as Stripe.Subscription;
                    const userId = subscription.metadata?.user_id;

                    if (userId) {
                         const periodEnd = subscription.current_period_end;
                         await supabase
                              .from('establishments')
                              .update({
                                   subscription_status: subscription.status,
                                   current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
                              })
                              .eq('user_id', userId);
                    }
                    break;
               }

               case 'customer.subscription.deleted': {
                    const subscription = event.data.object as Stripe.Subscription;
                    const userId = subscription.metadata?.user_id;

                    if (userId) {
                         await supabase
                              .from('establishments')
                              .update({
                                   subscription_status: 'canceled',
                                   plan_type: 'expired',
                              })
                              .eq('user_id', userId);
                    }
                    break;
               }

               case 'invoice.payment_failed': {
                    const invoice = event.data.object as Stripe.Invoice;
                    const subscriptionId = invoice.subscription;

                    if (subscriptionId && typeof subscriptionId === 'string') {
                         const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                         const userId = subscription.metadata?.user_id;

                         if (userId) {
                              await supabase
                                   .from('establishments')
                                   .update({
                                        subscription_status: 'past_due',
                                   })
                                   .eq('user_id', userId);
                         }
                    }
                    break;
               }

               default:
                    console.log(`Unhandled event type: ${event.type}`);
          }

          return NextResponse.json({ received: true });
     } catch (error: any) {
          console.error('Webhook error:', error);
          return NextResponse.json(
               { error: error.message },
               { status: 500 }
          );
     }
}
