import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";

interface ProdShellProps {
  children: ReactNode;
  userName: string;
  establishmentName: string;
  pageTitle?: string;
  pageDescription?: string;
  headerActions?: ReactNode;
}

export function ProdShell({
  children,
  userName,
  establishmentName,
  pageTitle,
  pageDescription,
  headerActions,
}: ProdShellProps) {
  return (
    <DashboardLayout
      userName={userName}
      establishmentName={establishmentName}
      pageTitle={pageTitle}
      pageDescription={pageDescription}
      headerActions={headerActions}
    >
      {children}
    </DashboardLayout>
  );
}
