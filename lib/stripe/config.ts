import Stripe from "stripe";

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// Legacy export for backward compatibility (lazy)
export const stripe = {
  get instance() {
    return getStripe();
  },
};

// Stripe configuration
export const STRIPE_CONFIG = {
  // Price IDs — maps to NEXT_PUBLIC_STRIPE_*_PRICE_ID env vars
  prices: {
    barMonthly: process.env.NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID!,
    barYearly: process.env.NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID!,
    chain: process.env.NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID!,
  },
  // Trial period in days
  trialPeriodDays: 30,
  // Success and cancel URLs
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
};

// Plan types — must match plan_type values stored in establishments table
// and getPlanTypeFromPriceId() in app/api/webhooks/stripe/route.ts
export type PlanType =
  | "free_trial"
  | "bar_monthly"
  | "bar_yearly"
  | "chain"
  | "expired";

// Subscription status
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired";
