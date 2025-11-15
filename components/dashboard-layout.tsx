import { SidebarNav } from "@/components/sidebar-nav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName: string;
  establishmentName: string;
}

export function DashboardLayout({ children, userName, establishmentName }: DashboardLayoutProps) {
  return (
    <div className="min-h-svh bg-background">
      <SidebarNav userName={userName} establishmentName={establishmentName} />
      {/* Main content with left margin for sidebar */}
      <div className="ml-72 transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
