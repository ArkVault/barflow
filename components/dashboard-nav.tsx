"use client";

import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Package, ShoppingCart, TrendingUp, Home, LogOut, BarChart3 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface DashboardNavProps {
  userName: string;
  establishmentName: string;
}

export function DashboardNav({ userName, establishmentName }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const navItems = [
    { href: "/dashboard", label: "Inicio", icon: Home },
    { href: "/dashboard/insumos", label: "Insumos", icon: Package },
    { href: "/dashboard/productos", label: "Productos", icon: ShoppingCart },
    { href: "/dashboard/ventas", label: "Ventas", icon: BarChart3 },
    { href: "/dashboard/proyecciones", label: "Proyecciones", icon: TrendingUp },
  ];

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="block">
              <img
                src="/modoclaro.png"
                alt="Flowstock"
                className="h-8 dark:hidden"
              />
              <img
                src="/modoclaro.png"
                alt="Flowstock"
                className="h-8 hidden dark:block dark:invert"
              />
            </Link>
            <div className="hidden md:flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "gap-2",
                        pathname === item.href && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm text-right">
              <p className="font-medium">{establishmentName}</p>
              <p className="text-muted-foreground text-xs">{userName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
