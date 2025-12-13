"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Boxes, Package2, Receipt, BarChart3, ChevronLeft, ClipboardList, LayoutDashboard, User, Grid3x3 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/hooks/use-language";

const demoNavItems = [
  { href: "/demo", labelKey: "dashboard" as const, icon: LayoutDashboard },
  { href: "/demo/planner", labelKey: "planner" as const, icon: ClipboardList },
  { href: "/demo/insumos", labelKey: "supplies" as const, icon: Boxes },
  { href: "/demo/productos", labelKey: "products" as const, icon: Package2 },
  { href: "/demo/operaciones", labelKey: "operations" as const, icon: Grid3x3 },
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
      <div className="relative h-[560px] max-h-[85vh] w-full neumorphic rounded-[2rem] bg-background/90 px-4 py-6 flex flex-col">
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

        {/* Theme, Language, and Account Icons - Top Right */}
        <div className={cn("absolute top-4 right-4 flex gap-1", isCollapsed && "flex-col")}>
          <div className="scale-90 origin-top-right">
            <ThemeToggle />
          </div>
          <div className="scale-90 origin-top-right">
            <LanguageToggle />
          </div>
          <div className="scale-90 origin-top-right">
            <Link href="/demo/cuenta" title={t('account')}>
              <button
                className={cn(
                  "h-10 w-10 rounded-lg inline-flex items-center justify-center transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "neumorphic-hover border-0"
                )}
              >
                <User className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Logo / Title */}
        <Link href="/demo" className="mb-8 mt-12 block">
          <img
            src="/modoclaro.png"
            alt="Barmode Demo"
            className={cn(
              "dark:hidden transition-all object-contain",
              isCollapsed ? "h-3.5 mx-auto" : "h-4.5"
            )}
          />
          <img
            src="/modoscuro.png"
            alt="Barmode Demo"
            className={cn(
              "hidden dark:block transition-all object-contain",
              isCollapsed ? "h-3.5 mx-auto" : "h-4.5"
            )}
          />
          {!isCollapsed && (
            <span className="text-xs font-medium text-muted-foreground mt-2 block">Demo</span>
          )}
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {demoNavItems.map((item) => {
            const isActive = pathname === item.href;
            const displayLabel: string = t(item.labelKey);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="block"
                title={isCollapsed ? displayLabel : undefined}
              >
                <div className="relative btn-glow-wrapper">
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/20 dark:bg-primary/30 text-gray-900 dark:text-gray-100 shadow-lg shadow-primary/30"
                        : "hover:bg-accent/60 text-gray-900 dark:text-gray-100",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>{displayLabel}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
