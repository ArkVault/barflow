"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

// Dev accounts that bypass trial restrictions (comma-separated in env var)
const DEV_EMAILS: string[] = (process.env.NEXT_PUBLIC_DEV_EMAILS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export interface SubscriptionData {
  isActive: boolean;
  isTrialing: boolean;
  isCanceling: boolean;
  isPaused: boolean;
  trialEnded: boolean;
  planType: string | null;
  trialEndDate: Date | null;
  daysRemaining: number;
  subscriptionStatus: string | null;
  isDevAccount: boolean;
}

export function useSubscription() {
  const { user, establishmentId } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    isActive: false,
    isTrialing: false,
    isCanceling: false,
    isPaused: false,
    trialEnded: false,
    planType: null,
    trialEndDate: null,
    daysRemaining: 0,
    subscriptionStatus: null,
    isDevAccount: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user || !establishmentId) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("establishments")
      .select(
        "trial_end_date, subscription_status, plan_type, stripe_subscription_id",
      )
      .eq("id", establishmentId)
      .single();

    if (error) {
      console.error("Error fetching subscription:", error);
      setLoading(false);
      return;
    }

    if (data) {
      const now = new Date();
      const trialEndDate = data.trial_end_date
        ? new Date(data.trial_end_date)
        : null;
      const isTrialing = trialEndDate ? now < trialEndDate : false;
      const trialEnded = trialEndDate ? now >= trialEndDate : false;
      const daysRemaining = trialEndDate
        ? Math.max(
            0,
            Math.ceil(
              (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            ),
          )
        : 0;

      const hasActiveSubscription =
        data.subscription_status === "active" ||
        data.subscription_status === "canceling";
      const isStripeTrialing = data.subscription_status === "trialing";
      const isEffectivelyTrialing = isTrialing || isStripeTrialing;
      const isCanceling = data.subscription_status === "canceling";
      const isPaused = data.subscription_status === "paused";

      const isDevAccount = user?.email
        ? DEV_EMAILS.includes(user.email)
        : false;

      setSubscription({
        isActive:
          isDevAccount ||
          hasActiveSubscription ||
          isEffectivelyTrialing ||
          isPaused,
        isTrialing: isEffectivelyTrialing,
        isCanceling,
        isPaused,
        trialEnded: isDevAccount
          ? false
          : trialEnded && !hasActiveSubscription && !isStripeTrialing,
        planType: data.plan_type,
        trialEndDate,
        daysRemaining,
        subscriptionStatus: data.subscription_status,
        isDevAccount,
      });
    }

    setLoading(false);
  }, [user, establishmentId]);

  // Fetch on mount and refetch when returning from Stripe checkout
  useEffect(() => {
    if (!user || !establishmentId) {
      setLoading(false);
      return;
    }

    fetchSubscription();
  }, [user, establishmentId, fetchSubscription]);

  // Refetch when returning from Stripe checkout (?session_id= in URL)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("session_id")) {
      fetchSubscription();
    }
  }, [fetchSubscription]);

  return { subscription, loading, refetch: fetchSubscription };
}
