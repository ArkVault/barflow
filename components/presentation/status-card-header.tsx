"use client";

import type { ReactNode } from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusCardHeaderProps {
  icon: string;
  title: string;
  description: string;
  rightSlot?: ReactNode;
}

export function StatusCardHeader({
  icon,
  title,
  description,
  rightSlot,
}: StatusCardHeaderProps) {
  if (rightSlot) {
    return (
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              {icon} {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 md:items-end">{rightSlot}</div>
        </div>
      </CardHeader>
    );
  }

  return (
    <CardHeader>
      <CardTitle className="text-xl flex items-center gap-2">
        {icon} {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
}
