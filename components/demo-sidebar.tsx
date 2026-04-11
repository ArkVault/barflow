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
  Users,
  UserCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { UpgradePlanButton } from "@/components/upgrade-plan-button";
import { useLanguage } from "@/hooks/use-language";
import { createClient } from "@/lib/supabase/client";
import { useStaff } from "@/contexts/staff-context";
import {
  ROLE_ROUTES,
  ROLE_LABELS,
  canSeeAccountMenu,
  StaffRole,
} from "@/lib/roles";

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

const allDashboardNavItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/planner", labelKey: "planner", icon: ClipboardList },
  { href: "/dashboard/insumos", labelKey: "supplies", icon: Boxes },
  { href: "/dashboard/productos", labelKey: "products", icon: Package2 },
  { href: "/dashboard/punto-de-venta", labelKey: "pos", icon: ShoppingCart },
  { href: "/dashboard/proyecciones", labelKey: "projections", icon: BarChart3 },
  { href: "/dashboard/equipo", labelKey: "team", icon: Users },
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
  const { t, language } = useLanguage();

  const isDashboard = mode === "dashboard";
  const demoBasePath = getDemoBasePath(pathname);

  // Role-aware filtering (dashboard mode only)
  const { role, staff, logoutStaff } = useStaff();
  const allowedRoutes = new Set(ROLE_ROUTES[role]);

  const navItems = isDashboard
    ? allDashboardNavItems.filter((item) => allowedRoutes.has(item.href))
    : demoNavItems.map((item) => ({
        ...item,
        href: toDemoPath(demoBasePath, item.href),
      }));

  const bottomItems = isDashboard
    ? canSeeAccountMenu(role)
      ? dashboardBottomItems
      : []
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

  const roleLabel =
    isDashboard && staff
      ? ROLE_LABELS[role as StaffRole][language === "es" ? "es" : "en"]
      : null;

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
          {(!isDashboard || canSeeAccountMenu(role)) && (
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
          )}
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
          {/* Staff / owner info */}
          {isDashboard && staff ? (
            <div className="px-2 mb-2">
              {establishmentName && (
                <p className="font-medium text-sm truncate">
                  {establishmentName}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-0.5">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <p className="text-muted-foreground text-xs truncate">
                  {staff.name}
                  {roleLabel && (
                    <span className="ml-1 text-muted-foreground/60">
                      · {roleLabel}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            (userName || establishmentName) && (
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
            )
          )}

          {/* Bottom nav items (Account — admin only) */}
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

          {/* Upgrade Plan — admin only */}
          {(!isDashboard || canSeeAccountMenu(role)) && (
            <div className="px-2 my-2">
              <UpgradePlanButton className="w-full" />
            </div>
          )}

          {/* Logout / End shift */}
          {isDashboard && staff ? (
            <button
              onClick={logoutStaff}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium hover:bg-amber-500/10 hover:text-amber-600 transition-all w-full"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>{language === "es" ? "Salir del turno" : "End shift"}</span>
            </button>
          ) : (
            (!isDashboard || canSeeAccountMenu(role)) && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-all w-full"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span>{t("logout")}</span>
              </button>
            )
          )}
        </div>
      </div>
    </aside>
  );
}
