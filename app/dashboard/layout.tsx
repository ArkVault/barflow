"use client";

import { useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { StaffProvider, useStaff } from "@/contexts/staff-context";
import { useAuth } from "@/contexts/auth-context";
import { canAccessRoute, defaultRouteForRole } from "@/lib/roles";

function DashboardRouteGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: staffLoading } = useStaff();
  const pathname = usePathname();
  const router = useRouter();

  const isLoading = authLoading || staffLoading;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (!canAccessRoute(role, pathname)) {
      router.replace(defaultRouteForRole(role));
    }
  }, [isLoading, user, role, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  if (!canAccessRoute(role, pathname)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <StaffProvider>
      <DashboardRouteGuard>{children}</DashboardRouteGuard>
    </StaffProvider>
  );
}
