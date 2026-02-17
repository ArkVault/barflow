"use client";

import { useEffect, useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionModal } from "./subscription-modal";
import { usePathname } from "next/navigation";

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
     const { subscription, loading } = useSubscription();
     const [showModal, setShowModal] = useState(false);
     const pathname = usePathname();

     // Don't show modal on auth pages
     const isAuthPage = pathname?.startsWith("/auth");

     useEffect(() => {
          if (!loading && !isAuthPage && subscription.trialEnded) {
               // Show modal after a short delay for better UX
               const timer = setTimeout(() => {
                    setShowModal(true);
               }, 1000);

               return () => clearTimeout(timer);
          }
     }, [loading, subscription.trialEnded, isAuthPage]);

     return (
          <>
               {children}
               <SubscriptionModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    trialEnded={subscription.trialEnded}
               />
          </>
     );
}
