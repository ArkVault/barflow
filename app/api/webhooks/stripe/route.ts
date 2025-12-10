import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to find establishment by subscription ID
async function findEstablishmentBySubscription(supabase: any, subscriptionId: string) {
     const { data } = await supabase
          .from("establishments")
          .select("id, user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();
     return data;
}

// Helper function to determine plan type from price ID
function getPlanTypeFromPriceId(priceId: string): string {
     const chainPriceId = process.env.NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID;
     const barYearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID;
     const barMonthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID;

     if (priceId === chainPriceId) return "chain";
     if (priceId === barYearlyPriceId) return "bar_yearly";
     if (priceId === barMonthlyPriceId) return "bar_monthly";
     return "bar_monthly"; // default
}

export async function POST(req: NextRequest) {
     try {
          const body = await req.text();
          const signature = req.headers.get("stripe-signature");

          if (!signature) {
               return NextResponse.json(
                    { error: "Missing stripe-signature header" },
                    { status: 400 }
               );
          }

          let event: Stripe.Event;

          try {
               event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
          } catch (err: any) {
               console.error("Webhook signature verification failed:", err.message);
               return NextResponse.json(
                    { error: `Webhook Error: ${err.message}` },
                    { status: 400 }
               );
          }

          const supabase = await createClient();

          // Handle the event
          switch (event.type) {
               // ========== CHECKOUT ==========
               case "checkout.session.completed": {
                    const session = event.data.object as Stripe.Checkout.Session;
                    const establishmentId = session.metadata?.establishment_id;
                    const subscriptionId = session.subscription as string;

                    if (establishmentId && subscriptionId) {
                         // Get price ID to determine plan type
                         const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);
                         const priceId = subscriptionData.items.data[0]?.price.id;
                         const planType = getPlanTypeFromPriceId(priceId);

                         await supabase
                              .from("establishments")
                              .update({
                                   stripe_subscription_id: subscriptionId,
                                   subscription_status: "active",
                                   plan_type: planType,
                                   current_period_end: new Date((subscriptionData as any).current_period_end * 1000).toISOString(),
                              })
                              .eq("id", establishmentId);

                         console.log(`✅ Subscription activated: ${establishmentId} (${planType})`);
                    }
                    break;
               }

               // ========== SUBSCRIPTION LIFECYCLE ==========
               case "customer.subscription.created": {
                    const subscription = event.data.object as Stripe.Subscription;
                    const establishmentId = subscription.metadata?.establishment_id;

                    if (establishmentId) {
                         const priceId = subscription.items.data[0]?.price.id;
                         const planType = getPlanTypeFromPriceId(priceId);

                         await supabase
                              .from("establishments")
                              .update({
                                   stripe_subscription_id: subscription.id,
                                   subscription_status: subscription.status,
                                   plan_type: planType,
                                   current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                              })
                              .eq("id", establishmentId);

                         console.log(`✅ Subscription created: ${establishmentId}`);
                    }
                    break;
               }

               case "customer.subscription.updated": {
                    const subscription = event.data.object as Stripe.Subscription;
                    const establishmentId = subscription.metadata?.establishment_id;

                    if (establishmentId) {
                         // Detect plan changes
                         const priceId = subscription.items.data[0]?.price.id;
                         const planType = getPlanTypeFromPriceId(priceId);

                         await supabase
                              .from("establishments")
                              .update({
                                   subscription_status: subscription.status,
                                   plan_type: planType,
                                   current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                              })
                              .eq("id", establishmentId);

                         console.log(`✅ Subscription updated: ${establishmentId} -> ${subscription.status} (${planType})`);
                    }
                    break;
               }

               case "customer.subscription.deleted": {
                    const subscription = event.data.object as Stripe.Subscription;
                    const establishmentId = subscription.metadata?.establishment_id;

                    if (establishmentId) {
                         await supabase
                              .from("establishments")
                              .update({
                                   subscription_status: "canceled",
                                   stripe_subscription_id: null,
                                   plan_type: "free_trial", // Revert to free trial
                              })
                              .eq("id", establishmentId);

                         console.log(`⚠️ Subscription canceled: ${establishmentId}`);
                    }
                    break;
               }

               // ========== TRIAL ==========
               case "customer.subscription.trial_will_end": {
                    const subscription = event.data.object as Stripe.Subscription;
                    const establishmentId = subscription.metadata?.establishment_id;

                    if (establishmentId) {
                         // Mark that trial is ending soon (3 days warning)
                         await supabase
                              .from("establishments")
                              .update({
                                   trial_ending_soon: true,
                              })
                              .eq("id", establishmentId);

                         console.log(`⏰ Trial ending soon: ${establishmentId} (3 days)`);

                         // TODO: Send email notification to user
                         // await sendTrialEndingEmail(establishment.user_id);
                    }
                    break;
               }

               // ========== PAUSE/RESUME ==========
               case "customer.subscription.paused": {
                    const subscription = event.data.object as Stripe.Subscription;
                    const establishmentId = subscription.metadata?.establishment_id;

                    if (establishmentId) {
                         await supabase
                              .from("establishments")
                              .update({
                                   subscription_status: "paused",
                              })
                              .eq("id", establishmentId);

                         console.log(`⏸️ Subscription paused: ${establishmentId}`);
                    }
                    break;
               }

               case "customer.subscription.resumed": {
                    const subscription = event.data.object as Stripe.Subscription;
                    const establishmentId = subscription.metadata?.establishment_id;

                    if (establishmentId) {
                         await supabase
                              .from("establishments")
                              .update({
                                   subscription_status: "active",
                              })
                              .eq("id", establishmentId);

                         console.log(`▶️ Subscription resumed: ${establishmentId}`);
                    }
                    break;
               }

               // ========== PAYMENTS ==========
               case "invoice.payment_succeeded": {
                    const invoice = event.data.object as any;
                    const subscriptionId = invoice.subscription as string;

                    if (subscriptionId) {
                         const establishment = await findEstablishmentBySubscription(supabase, subscriptionId);

                         if (establishment) {
                              await supabase
                                   .from("establishments")
                                   .update({
                                        subscription_status: "active",
                                        last_payment_date: new Date().toISOString(),
                                   })
                                   .eq("id", establishment.id);

                              console.log(`💳 Payment succeeded: ${establishment.id}`);
                         }
                    }
                    break;
               }

               case "invoice.payment_failed": {
                    const invoice = event.data.object as any;
                    const subscriptionId = invoice.subscription as string;

                    if (subscriptionId) {
                         const establishment = await findEstablishmentBySubscription(supabase, subscriptionId);

                         if (establishment) {
                              // Check attempt count for escalation
                              const attemptCount = invoice.attempt_count || 1;

                              await supabase
                                   .from("establishments")
                                   .update({
                                        subscription_status: attemptCount >= 3 ? "unpaid" : "past_due",
                                        payment_failed_count: attemptCount,
                                   })
                                   .eq("id", establishment.id);

                              console.log(`❌ Payment failed (attempt ${attemptCount}): ${establishment.id}`);

                              // TODO: Send payment failed notification
                              // await sendPaymentFailedEmail(establishment.user_id, attemptCount);
                         }
                    }
                    break;
               }

               case "invoice.payment_action_required": {
                    const invoice = event.data.object as any;
                    const subscriptionId = invoice.subscription as string;

                    if (subscriptionId) {
                         const establishment = await findEstablishmentBySubscription(supabase, subscriptionId);

                         if (establishment) {
                              await supabase
                                   .from("establishments")
                                   .update({
                                        subscription_status: "requires_action",
                                   })
                                   .eq("id", establishment.id);

                              console.log(`🔐 Payment action required: ${establishment.id}`);
                         }
                    }
                    break;
               }

               // ========== DISPUTES ==========
               case "charge.dispute.created": {
                    const dispute = event.data.object as Stripe.Dispute;
                    console.log(`⚖️ Dispute created: ${dispute.id} - Amount: ${dispute.amount}`);

                    // Could flag the customer or restrict access
                    // For now, just log it
                    break;
               }

               case "charge.dispute.closed": {
                    const dispute = event.data.object as Stripe.Dispute;
                    console.log(`✅ Dispute closed: ${dispute.id} - Status: ${dispute.status}`);
                    break;
               }

               // ========== REFUNDS ==========
               case "charge.refunded": {
                    const charge = event.data.object as Stripe.Charge;
                    console.log(`💸 Charge refunded: ${charge.id} - Amount: ${charge.amount_refunded}`);

                    // If full refund, could cancel subscription
                    // For partial refunds, just log
                    break;
               }

               default:
                    console.log(`ℹ️ Unhandled event type: ${event.type}`);
          }

          return NextResponse.json({ received: true });
     } catch (error: any) {
          console.error("Webhook error:", error);
          return NextResponse.json(
               { error: "Webhook handler failed" },
               { status: 500 }
          );
     }
}
