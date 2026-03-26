"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getDemoBasePath, toDemoPath } from "@/lib/utils/demo-route";
import { Boxes, Package2, BarChart3, ChevronLeft, ClipboardList, LayoutDashboard, User, ShoppingCart } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/hooks/use-language";

const demoNavItems = [
  { href: "/demo", labelKey: "dashboard" as const, icon: LayoutDashboard },
  { href: "/demo/planner", labelKey: "planner" as const, icon: ClipboardList },
  { href: "/demo/insumos", labelKey: "supplies" as const, icon: Boxes },
  { href: "/demo/productos", labelKey: "products" as const, icon: Package2 },
  { href: "/demo/punto-de-venta", labelKey: "pos" as const, icon: ShoppingCart },
  { href: "/demo/proyecciones", labelKey: "projections" as const, icon: BarChart3 },
];

export function DemoSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();
  const demoBasePath = getDemoBasePath(pathname);
  const navItems = demoNavItems.map((item) => ({
    ...item,
    href: toDemoPath(demoBasePath, item.href),
  }));

  return (
    <aside
      className={cn(
        "fixed left-4 top-1/2 -translate-y-1/2 z-40 transition-all duration-300",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      <div className="relative w-full neumorphic rounded-[2.5rem] bg-background/90 px-5 py-5 flex flex-col max-h-[92vh]">
        {/* Collapse Button - outside right edge */}
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="absolute -right-5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full neumorphic flex items-center justify-center bg-background hover:scale-105 transition-transform z-10"
          aria-label={isCollapsed ? "Expandir menú demo" : "Colapsar menú demo"}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              isCollapsed && "rotate-180"
            )}
          />
        </button>

        {/* Logo */}
        <div className="mb-3">
          <Link href={toDemoPath(demoBasePath, "/demo")} className="block">
            <img
              src="/logo-light.png"
              alt="Stttock"
              className={cn(
                "dark:hidden transition-all object-contain",
                isCollapsed ? "h-5" : "h-7"
              )}
            />
            <img
              src="/logo-dark.png"
              alt="Stttock"
              className={cn(
                "hidden dark:block transition-all object-contain",
                isCollapsed ? "h-5" : "h-7"
              )}
            />
          </Link>
          {!isCollapsed && (
            <span className="text-xs font-medium text-muted-foreground mt-1 block">v1.0</span>
          )}
        </div>

        {/* Theme, Language, and Account Icons */}
        <div className={cn("flex items-center gap-1 mb-3 pb-3 border-b border-border/30", isCollapsed && "flex-col")}>
          <div className="scale-90">
            <ThemeToggle />
          </div>
          <div className="scale-90">
            <LanguageToggle />
          </div>
          <div className="scale-90">
            <Link href={toDemoPath(demoBasePath, "/demo/cuenta")} title={t('account')}>
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

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
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
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-muted dark:bg-muted/80 text-gray-900 dark:text-gray-100 shadow-inner shadow-black/20 border border-border/40"
                        : "hover:bg-muted/60 text-gray-900 dark:text-gray-100",
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
