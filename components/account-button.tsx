"use client";

import { User } from "lucide-react";
import { GlowButton } from "./glow-button";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/hooks/use-language";

interface AccountButtonProps {
     className?: string;
}

export function AccountButton({ className }: AccountButtonProps) {
     const router = useRouter();
     const pathname = usePathname();
     const { t } = useLanguage();

     // Determine if we're in demo or dashboard
     const accountPath = pathname?.startsWith("/demo-public")
          ? "/demo-public/cuenta"
          : pathname?.startsWith("/demo-private")
               ? "/demo-private/cuenta"
               : pathname?.startsWith("/demo")
                    ? "/demo/cuenta"
                    : "/dashboard/cuenta";

     return (
          <GlowButton onClick={() => router.push(accountPath)} className={className}>
               <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-inner">
                    <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
               </div>
               <span className="hidden sm:inline">{t('account')}</span>
          </GlowButton>
     );
}
