"use client";

import type { ReactNode } from "react";
import { DemoSidebar } from "@/components/demo-sidebar";
import { TrialExpiredOverlay } from "@/components/trial-expired-overlay";
import { cn } from "@/lib/utils";

interface ProdShellProps {
  children: ReactNode;
  userName: string;
  establishmentName: string;
  className?: string;
}

export function ProdShell({
  children,
  userName,
  establishmentName,
  className,
}: ProdShellProps) {
  return (
    <div className={cn("min-h-svh bg-background", className)}>
      <DemoSidebar
        mode="dashboard"
        userName={userName}
        establishmentName={establishmentName}
      />
      <div className="min-h-screen ml-0 md:ml-72">{children}</div>
      <TrialExpiredOverlay />
    </div>
  );
}
