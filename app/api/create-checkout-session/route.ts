import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

// Lazy initialization to avoid build-time errors
let stripe: Stripe | null = null;

function getStripe(): Stripe {
     if (!stripe) {
          if (!process.env.STRIPE_SECRET_KEY) {
               throw new Error("STRIPE_SECRET_KEY is not configured");
          }
          stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
               apiVersion: "2025-11-17.clover",
          });
     }
     return stripe;
}

export async function POST(req: NextRequest) {
     try {
          const { priceId, userId, userEmail, establishmentId } = await req.json();

          if (!priceId || !userId || !userEmail) {
               return NextResponse.json(
                    { error: "Missing required fields" },
                    { status: 400 }
               );
          }

          // Get or create Stripe customer
          const supabase = await createClient();

          const { data: establishment } = await supabase
               .from("establishments")
               .select("stripe_customer_id")
               .eq("id", establishmentId)
               .single();

          let customerId = establishment?.stripe_customer_id;

          // Create customer if doesn't exist
          if (!customerId) {
               const customer = await getStripe().customers.create({
                    email: userEmail,
                    metadata: {
                         user_id: userId,
                         establishment_id: establishmentId,
                    },
               });
               customerId = customer.id;

               // Save customer ID to database
               await supabase
                    .from("establishments")
                    .update({ stripe_customer_id: customerId })
                    .eq("id", establishmentId);
          }

          // Create Checkout Session
          const session = await getStripe().checkout.sessions.create({
               customer: customerId,
               mode: "subscription",
               payment_method_types: ["card"],
               line_items: [
                    {
                         price: priceId,
                         quantity: 1,
                    },
               ],
               success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
               cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
               metadata: {
                    user_id: userId,
                    establishment_id: establishmentId,
               },
               subscription_data: {
                    metadata: {
                         user_id: userId,
                         establishment_id: establishmentId,
                    },
               },
          });

          return NextResponse.json({
               sessionId: session.id,
               url: session.url
          });
     } catch (error: any) {
          console.error("Error creating checkout session:", error);
          return NextResponse.json(
               { error: error.message || "Error creating checkout session" },
               { status: 500 }
          );
     }
}
