import { SidebarNav } from "@/components/sidebar-nav";
import { PageHeader } from "@/components/page-header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName: string;
  establishmentName: string;
  pageTitle?: string;
  pageDescription?: string;
  headerActions?: React.ReactNode;
}

export function DashboardLayout({
  children,
  userName,
  establishmentName,
  pageTitle,
  pageDescription,
  headerActions
}: DashboardLayoutProps) {
  return (
    <div className="min-h-svh bg-background">
      <SidebarNav userName={userName} establishmentName={establishmentName} />
      {/* Main content with left margin for sidebar */}
      <div className="ml-72 transition-all duration-300">
        {pageTitle && (
          <PageHeader title={pageTitle} description={pageDescription}>
            {headerActions}
          </PageHeader>
        )}
        {children}
      </div>
    </div>
  );
}
