"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

// Dev accounts that bypass trial restrictions
const DEV_EMAILS = [
     "gibrann@gmail.com",
     "dev@barflow.mx",
     // Add more dev emails as needed
];

export interface SubscriptionData {
     isActive: boolean;
     isTrialing: boolean;
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
          trialEnded: false,
          planType: null,
          trialEndDate: null,
          daysRemaining: 0,
          subscriptionStatus: null,
          isDevAccount: false,
     });
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          if (!user || !establishmentId) {
               setLoading(false);
               return;
          }

          const fetchSubscription = async () => {
               const supabase = createClient();

               const { data, error } = await supabase
                    .from("establishments")
                    .select("trial_end_date, subscription_status, plan_type, stripe_subscription_id")
                    .eq("id", establishmentId)
                    .single();

               if (error) {
                    console.error("Error fetching subscription:", error);
                    setLoading(false);
                    return;
               }

               if (data) {
                    const now = new Date();
                    const trialEndDate = data.trial_end_date ? new Date(data.trial_end_date) : null;
                    const isTrialing = trialEndDate ? now < trialEndDate : false;
                    const trialEnded = trialEndDate ? now >= trialEndDate : false;
                    const daysRemaining = trialEndDate
                         ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                         : 0;

                    const hasActiveSubscription =
                         data.subscription_status === "active" ||
                         data.subscription_status === "trialing";

                    // Check if this is a dev account
                    const isDevAccount = user?.email ? DEV_EMAILS.includes(user.email) : false;

                    setSubscription({
                         // Dev accounts are always active
                         isActive: isDevAccount || hasActiveSubscription || isTrialing,
                         isTrialing,
                         // Dev accounts never show trial ended
                         trialEnded: isDevAccount ? false : (trialEnded && !hasActiveSubscription),
                         planType: data.plan_type,
                         trialEndDate,
                         daysRemaining,
                         subscriptionStatus: data.subscription_status,
                         isDevAccount,
                    });
               }

               setLoading(false);
          };

          fetchSubscription();

          // Subscribe to changes
          const supabase = createClient();
          const channel = supabase
               .channel("subscription-changes")
               .on(
                    "postgres_changes",
                    {
                         event: "UPDATE",
                         schema: "public",
                         table: "establishments",
                         filter: `id=eq.${establishmentId}`,
                    },
                    () => {
                         fetchSubscription();
                    }
               )
               .subscribe();

          return () => {
               channel.unsubscribe();
          };
     }, [user, establishmentId]);

     return { subscription, loading };
}
