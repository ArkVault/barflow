import Stripe from "stripe";

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
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

// ─── Canonical pricing (MXN / month) ────────────────────────────────────────
export const PLAN_PRICING = {
  starter: { monthly: 1_899, yearly: 1_499, baseUsers: 5 },
  business: { monthly: 3_499, yearly: 2_999, baseUsers: 10 },
  cadena: {
    monthlyPerBranch: 2_999,
    yearlyPerBranch: 2_399,
    baseUsersPerBranch: 10,
  },
  enterprise: {
    baseFee: 4_500,
    monthlyPerBranch: 1_800,
    yearlyPerBranch: 1_500,
    baseUsers: Infinity,
  },
  extraUsersBlockSize: 5,
  extraUsersBlockRate: 800,
  devicesAlwaysFree: true,
} as const;

// Stripe configuration
export const STRIPE_CONFIG = {
  // Price IDs — maps to NEXT_PUBLIC_STRIPE_*_PRICE_ID env vars
  prices: {
    starterMonthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID!,
    starterYearly: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID!,
    businessMonthly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID!,
    businessYearly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID!,
    // Cadena & Enterprise are quote-only — no self-serve price IDs
  },
  // Trial period in days
  trialPeriodDays: 21,
  // Success and cancel URLs
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
};

// Plan types — must match plan_type values stored in establishments table
// and getPlanTypeFromPriceId() in app/api/webhooks/stripe/route.ts
export type PlanType =
  | "free_trial"
  | "starter_monthly"
  | "starter_yearly"
  | "business_monthly"
  | "business_yearly"
  | "chain"
  | "enterprise"
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
