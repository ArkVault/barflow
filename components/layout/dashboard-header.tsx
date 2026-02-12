"use client";

import { useLanguage } from "@/hooks/use-language";

export function DashboardHeader() {
     const { t } = useLanguage();

     return (
          <div>
               <h1 className="text-4xl font-bold mb-2 text-balance">{t('businessOverview')}</h1>
               <p className="text-muted-foreground">{t('establishmentSummary')}</p>
          </div>
     );
}
