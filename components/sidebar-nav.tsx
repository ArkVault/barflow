"use client";

import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { UpgradePlanButton } from "@/components/upgrade-plan-button";
import { useLanguage } from "@/hooks/use-language";

interface SidebarNavProps {
  userName: string;
  establishmentName: string;
}

export function SidebarNav({ userName, establishmentName }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const navItems = [
    { href: "/dashboard", label: t('dashboard'), icon: "🏠" },
    { href: "/dashboard/planner", label: t('planner'), icon: "📋" },
    { href: "/dashboard/insumos", label: t('supplies'), icon: "📦" },
    { href: "/dashboard/productos", label: t('products'), icon: "🛒" },
    { href: "/dashboard/ventas", label: t('sales'), icon: "📊" },
    { href: "/dashboard/proyecciones", label: t('projections'), icon: "📈" },
  ];

  const bottomNavItems = [
    { href: "/dashboard/cuenta", label: t('account'), icon: "👤" },
    { href: "/dashboard/configuracion", label: t('settings'), icon: "⚙️" },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-background transition-all duration-300 z-50",
        isCollapsed ? "w-24" : "w-76"
      )}
    >
      {/* Sidebar Panel with Neumorphism */}
      <div className="h-full p-4">
        <div className="h-full neumorphic rounded-[2.5rem] p-6 flex flex-col relative">

          {/* Collapse Button - outside right edge */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full neumorphic flex items-center justify-center hover:scale-105 transition-transform z-10"
            aria-label={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
          >
            <span className={cn("text-xl transition-transform", isCollapsed && "rotate-180")}>‹</span>
          </button>

          {/* Logo */}
          <div className="mb-4">
            <Link href="/dashboard" className="block">
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
          </div>

          {/* Theme and Language Toggles */}
          <div className={cn("flex items-center gap-2 mb-4 pb-4 border-b border-border/30", isCollapsed && "flex-col")}>
            <ThemeToggle />
            <LanguageToggle />
          </div>

          {/* Main Navigation Items */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <div className="relative btn-glow-wrapper">
                    <div
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200",
                        isActive
                          ? "bg-muted dark:bg-muted/80 text-gray-900 dark:text-gray-100 shadow-inner shadow-black/20 border border-border/40"
                          : "hover:bg-muted/60 text-gray-900 dark:text-gray-100",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <span className="text-xl flex-shrink-0">{item.icon}</span>
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 pt-6 border-t border-border/50">
            {/* Establishment & User Info */}
            {!isCollapsed && (
              <div className="px-2 mb-4">
                <p className="font-medium text-sm truncate">{establishmentName}</p>
                <p className="text-muted-foreground text-xs truncate">{userName}</p>
              </div>
            )}

            {/* Account & Settings Navigation */}
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200",
                      isActive
                        ? "bg-muted dark:bg-muted/80 text-foreground shadow-inner shadow-black/20 border border-border/40"
                        : "hover:bg-muted/60",
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && <span className="font-medium">{item.label}</span>}
                  </div>
                </Link>
              );
            })

            }

            {/* Upgrade Plan Button */}
            {!isCollapsed && (
              <div className="px-2 mb-2">
                <UpgradePlanButton className="w-full" />
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-all w-full",
                isCollapsed && "justify-center px-2"
              )}
            >
              <span className="text-xl flex-shrink-0">🚪</span>
              {!isCollapsed && <span className="font-medium">{t('logout')}</span>}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
