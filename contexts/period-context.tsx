"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type UrgencyPeriod = "day" | "week" | "month";

interface PeriodContextType {
  period: UrgencyPeriod;
  setPeriod: (period: UrgencyPeriod) => void;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<UrgencyPeriod>("week");

  return (
    <PeriodContext.Provider value={{ period, setPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error("usePeriod must be used within a PeriodProvider");
  }
  return context;
}
