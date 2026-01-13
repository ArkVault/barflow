import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
     if (!stripeInstance) {
          if (!process.env.STRIPE_SECRET_KEY) {
               throw new Error("STRIPE_SECRET_KEY is not configured");
          }
          stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
               apiVersion: '2025-11-17.clover',
               typescript: true,
          });
     }
     return stripeInstance;
}

// Legacy export for backward compatibility (lazy)
export const stripe = {
     get instance() {
          return getStripe();
     }
};

// Stripe configuration
export const STRIPE_CONFIG = {
     // Price IDs - Replace these with your actual Stripe Price IDs
     prices: {
          monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!,
          yearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID!,
     },
     // Trial period in days
     trialPeriodDays: 30,
     // Success and cancel URLs
     successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
     cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
};

// Plan types
export type PlanType = 'free_trial' | 'monthly' | 'yearly' | 'expired';

// Subscription status
export type SubscriptionStatus =
     | 'active'
     | 'trialing'
     | 'past_due'
     | 'canceled'
     | 'unpaid'
     | 'incomplete'
     | 'incomplete_expired';
