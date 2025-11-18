"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Boxes, Package2, Receipt, BarChart3, ChevronLeft, ClipboardList } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/hooks/use-language";

const demoNavItems = [
  { href: "/demo/planner", labelKey: "planner" as const, icon: ClipboardList },
  { href: "/demo/insumos", labelKey: "supplies" as const, icon: Boxes },
  { href: "/demo/productos", labelKey: "products" as const, icon: Package2 },
  { href: "/demo/ventas", labelKey: "sales" as const, icon: Receipt },
  { href: "/demo/proyecciones", labelKey: "projections" as const, icon: BarChart3 },
];

export function DemoSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();

  return (
    <aside
      className={cn(
        "fixed left-4 top-1/2 -translate-y-1/2 z-40 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="relative h-[480px] max-h-[80vh] w-full neumorphic rounded-[2rem] bg-background/90 px-4 py-6 flex flex-col">
        {/* Collapse Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full neumorphic flex items-center justify-center bg-background hover:scale-105 transition-transform"
          aria-label={isCollapsed ? "Expandir menú demo" : "Colapsar menú demo"}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              isCollapsed && "rotate-180"
            )}
          />
        </button>

        {/* Theme and Language Toggles - Top Right */}
        <div className={cn("absolute top-4 right-4 flex gap-2", isCollapsed && "flex-col")}>
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {/* Logo / Title */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Package2 className="h-5 w-5 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Demo</span>
              <span className="text-lg font-semibold tracking-tight">BarFlow</span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {demoNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="block"
                title={isCollapsed ? item.label : undefined}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "hover:bg-accent/60",
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{t(item.labelKey)}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer badge */}
        <div className={cn("mt-4 flex items-center gap-3 px-2 text-xs text-muted-foreground", isCollapsed && "justify-center")}
        >
          <div className="h-7 rounded-full bg-accent flex items-center px-2 text-[10px] font-medium">
            <span className="mr-1">⚡</span>
            {!isCollapsed && <span>{t('demoMode')}</span>}
          </div>
        </div>
      </div>
    </aside>
  );
}
