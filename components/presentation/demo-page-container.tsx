"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DemoPageContainerProps {
  children: ReactNode;
  paddingClassName?: string;
  maxWidthClassName?: string;
  className?: string;
}

export function DemoPageContainer({
  children,
  paddingClassName = "p-6",
  maxWidthClassName = "max-w-5xl",
  className,
}: DemoPageContainerProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background ml-0 md:ml-72",
        paddingClassName,
        className,
      )}
    >
      <div className={cn("mx-auto", maxWidthClassName)}>{children}</div>
    </div>
  );
}
