"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface DemoTopNavProps {
  href?: string;
  alt?: string;
  variant?: "default" | "blur";
  rightSlot?: ReactNode;
  logoClassName?: string;
  darkLogoClassName?: string;
}

export function DemoTopNav({
  href,
  alt = "Stttock",
  variant = "default",
  rightSlot,
  logoClassName = "h-8 dark:hidden object-contain",
  darkLogoClassName = "h-8 hidden dark:block object-contain",
}: DemoTopNavProps) {
  const pathname = usePathname();
  const resolvedHref =
    href ||
    (pathname?.startsWith("/demo-public")
      ? "/demo-public"
      : pathname?.startsWith("/demo-private")
      ? "/demo-private"
      : "/demo");

  return (
    <nav
      className={cn(
        "border-b neumorphic-inset",
        variant === "blur" && "bg-background/80 backdrop-blur"
      )}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href={resolvedHref} className="block">
          <img src="/logo-light.png" alt={alt} className={logoClassName} />
          <img src="/logo-dark.png" alt={alt} className={darkLogoClassName} />
        </Link>
        {rightSlot}
      </div>
    </nav>
  );
}
