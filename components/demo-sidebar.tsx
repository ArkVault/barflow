"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getDemoBasePath, toDemoPath } from "@/lib/utils/demo-route";
import {
  Boxes,
  Package2,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  User,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { UpgradePlanButton } from "@/components/upgrade-plan-button";
import { useLanguage } from "@/hooks/use-language";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const demoNavItems: NavItem[] = [
  { href: "/demo", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/demo/planner", labelKey: "planner", icon: ClipboardList },
  { href: "/demo/insumos", labelKey: "supplies", icon: Boxes },
  { href: "/demo/productos", labelKey: "products", icon: Package2 },
  { href: "/demo/punto-de-venta", labelKey: "pos", icon: ShoppingCart },
  { href: "/demo/proyecciones", labelKey: "projections", icon: BarChart3 },
];

const demoBottomItems: NavItem[] = [
  { href: "/demo/cuenta", labelKey: "account", icon: User },
];

const dashboardNavItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/planner", labelKey: "planner", icon: ClipboardList },
  { href: "/dashboard/insumos", labelKey: "supplies", icon: Boxes },
  { href: "/dashboard/productos", labelKey: "products", icon: Package2 },
  { href: "/dashboard/punto-de-venta", labelKey: "pos", icon: ShoppingCart },
  { href: "/dashboard/proyecciones", labelKey: "projections", icon: BarChart3 },
];

const dashboardBottomItems: NavItem[] = [
  { href: "/dashboard/cuenta", labelKey: "account", icon: User },
];

interface DemoSidebarProps {
  mode?: "demo" | "dashboard";
  userName?: string;
  establishmentName?: string;
}

export function DemoSidebar({
  mode = "demo",
  userName,
  establishmentName,
}: DemoSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const isDashboard = mode === "dashboard";
  const demoBasePath = getDemoBasePath(pathname);

  const navItems = isDashboard
    ? dashboardNavItems
    : demoNavItems.map((item) => ({
        ...item,
        href: toDemoPath(demoBasePath, item.href),
      }));

  const bottomItems = isDashboard
    ? dashboardBottomItems
    : demoBottomItems.map((item) => ({
        ...item,
        href: toDemoPath(demoBasePath, item.href),
      }));

  const homeHref = isDashboard
    ? "/dashboard"
    : toDemoPath(demoBasePath, "/demo");

  const accountHref = isDashboard
    ? "/dashboard/cuenta"
    : toDemoPath(demoBasePath, "/demo/cuenta");

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside className="fixed left-4 top-1/2 -translate-y-1/2 z-40 w-72 hidden md:block">
      <div className="relative w-full neumorphic rounded-[2.5rem] bg-background/90 px-5 py-5 flex flex-col max-h-[92vh]">
        {/* Logo */}
        <div className="mb-3">
          <Link href={homeHref} className="block">
            <img
              src="/logo-light.png"
              alt="Stttock"
              className="dark:hidden transition-all object-contain h-7"
            />
            <img
              src="/logo-dark.png"
              alt="Stttock"
              className="hidden dark:block transition-all object-contain h-7"
            />
          </Link>
          <span className="text-xs font-medium text-muted-foreground mt-1 block">
            v1.0
          </span>
        </div>

        {/* Theme, Language, and Account Icons */}
        <div className="flex items-center gap-1 mb-3 pb-3 border-b border-border/30">
          <div className="scale-90">
            <ThemeToggle />
          </div>
          <div className="scale-90">
            <LanguageToggle />
          </div>
          <div className="scale-90">
            <Link href={accountHref} title={t("account")}>
              <button
                className={cn(
                  "h-10 w-10 rounded-lg inline-flex items-center justify-center transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "neumorphic-hover border-0",
                )}
              >
                <User className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Main Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const displayLabel: string = t(
              item.labelKey as Parameters<typeof t>[0],
            );

            return (
              <Link key={item.href} href={item.href} className="block">
                <div className="relative btn-glow-wrapper">
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-muted dark:bg-muted/80 text-gray-900 dark:text-gray-100 shadow-inner shadow-black/20 border border-border/40"
                        : "hover:bg-muted/60 text-gray-900 dark:text-gray-100",
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{displayLabel}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="space-y-1 pt-3 mt-3 border-t border-border/30">
          {/* Establishment & User Info */}
          {(userName || establishmentName) && (
            <div className="px-2 mb-2">
              {establishmentName && (
                <p className="font-medium text-sm truncate">
                  {establishmentName}
                </p>
              )}
              {userName && (
                <p className="text-muted-foreground text-xs truncate">
                  {userName}
                </p>
              )}
            </div>
          )}

          {/* Bottom nav items (Account) */}
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            const displayLabel: string = t(
              item.labelKey as Parameters<typeof t>[0],
            );

            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-muted dark:bg-muted/80 text-gray-900 dark:text-gray-100 shadow-inner shadow-black/20 border border-border/40"
                      : "hover:bg-muted/60 text-gray-900 dark:text-gray-100",
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{displayLabel}</span>
                </div>
              </Link>
            );
          })}

          {/* Upgrade Plan Button */}
          <div className="px-2 my-2">
            <UpgradePlanButton className="w-full" />
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-all w-full"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>{t("logout")}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
