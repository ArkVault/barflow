"use client";

import type { ReactNode } from "react";
import { DemoSidebar } from "@/components/demo-sidebar";
import { cn } from "@/lib/utils";

interface DemoShellProps {
  children: ReactNode;
  className?: string;
}

export function DemoShell({ children, className }: DemoShellProps) {
  return (
    <div className={cn("min-h-svh bg-background", className)}>
      <DemoSidebar />
      {children}
    </div>
  );
}
