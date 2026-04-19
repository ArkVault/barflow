/**
 * Plan recommendation logic.
 * Given onboarding answers, compute the best plan to suggest.
 *
 * Used by:
 *  - Onboarding final step (pre-fills checkout)
 *  - Subscription modal (highlights recommended card + auto-selects billing cycle)
 *  - Account > Subscription page (badge "Recomendado para ti")
 */

import type { PlanType } from "@/lib/stripe/config";

export type TeamCounts = Record<string, number>;
export type BranchMode = "single" | "multiple" | null;
export type InventoryMethod = "excel" | "manual" | null;

export interface RecommendationInput {
  teamCounts?: TeamCounts | null;
  branchMode?: BranchMode;
  inventoryMethod?: InventoryMethod;
}

export interface PlanRecommendation {
  planType: PlanType;
  // Stripe price ID for self-serve checkout (empty when plan is quote-only)
  priceId: string;
  // Display label (i18n handled at consumer level — keep raw)
  reason: string;
  // Billing cycle the modal should pre-select
  billingCycle: "monthly" | "yearly";
}

const STARTER_BASE_USERS = 5;

function totalTeamSize(counts?: TeamCounts | null): number {
  if (!counts) return 0;
  return Object.values(counts).reduce(
    (sum, n) => sum + (typeof n === "number" && Number.isFinite(n) ? n : 0),
    0,
  );
}

export function computeRecommendedPlan(
  input: RecommendationInput,
): PlanRecommendation {
  const { teamCounts, branchMode, inventoryMethod } = input;

  // Multi-branch operators always need Cadena (quote flow)
  if (branchMode === "multiple") {
    return {
      planType: "chain",
      priceId: "",
      reason: "multiple_branches",
      billingCycle: "yearly",
    };
  }

  const team = totalTeamSize(teamCounts);

  // > Starter base capacity → Business
  if (team > STARTER_BASE_USERS) {
    return {
      planType: "business_yearly",
      priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID ?? "",
      reason: "team_over_starter_capacity",
      billingCycle: "yearly",
    };
  }

  // Manual inventory entry = heavier daily usage → upsell Business
  if (inventoryMethod === "manual") {
    return {
      planType: "business_yearly",
      priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID ?? "",
      reason: "manual_inventory_workload",
      billingCycle: "yearly",
    };
  }

  // Default: small single-branch with Excel import
  return {
    planType: "starter_yearly",
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID ?? "",
    reason: "small_single_branch",
    billingCycle: "yearly",
  };
}

/**
 * Map a stored plan_type string (DB column) to the canonical card name
 * used by SubscriptionModal & AccountContent ("Starter" | "Business" | "Cadena" | "Enterprise").
 */
export function planTypeToCardName(
  planType: PlanType | string | null | undefined,
): "Starter" | "Business" | "Cadena" | "Enterprise" | null {
  if (!planType) return null;
  if (planType.startsWith("starter")) return "Starter";
  if (planType.startsWith("business")) return "Business";
  if (planType === "chain") return "Cadena";
  if (planType === "enterprise") return "Enterprise";
  return null;
}

/**
 * Map plan_type to the preferred billing cycle the UI should default to.
 */
export function planTypeToBillingCycle(
  planType: PlanType | string | null | undefined,
): "monthly" | "yearly" {
  if (!planType) return "yearly";
  return planType.endsWith("monthly") ? "monthly" : "yearly";
}
