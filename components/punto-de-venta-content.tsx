"use client";

import { useEffect } from "react";
import { LayoutGrid, FileText, History } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import {
  POSProvider,
  usePOS,
  TablesTab,
  OrdersTab,
  HistoryTab,
} from "@/components/pos";
import {
  canAccessPosTab,
  canAddSection,
  canCancelAccountDirect,
  type StaffRole,
} from "@/lib/roles";

const TABS = [
  { id: "mesas", labelEs: "Mesas", labelEn: "Tables", icon: LayoutGrid },
  { id: "comandas", labelEs: "Comandas", labelEn: "Orders", icon: FileText },
  {
    id: "historial",
    labelEs: "Registro de ventas",
    labelEn: "Sales History",
    icon: History,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface PuntoDeVentaContentProps {
  /**
   * When provided, tab visibility and per-action permissions are gated by
   * role helpers. When omitted (e.g. in /demo), all tabs and actions are
   * available.
   */
  role?: StaffRole | null;
}

function POSInner({ role }: PuntoDeVentaContentProps) {
  const { language } = useLanguage();
  const { activeTab, setActiveTab } = usePOS();

  const visibleTabs = role
    ? TABS.filter((tab) => canAccessPosTab(role, tab.id))
    : TABS;

  // If current active tab is not allowed for this role, reset to first allowed
  useEffect(() => {
    if (role && !canAccessPosTab(role, activeTab as TabId)) {
      setActiveTab("mesas");
    }
  }, [role, activeTab, setActiveTab]);

  return (
    <>
      <div className="mb-6">
        <h2
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: "Satoshi, sans-serif" }}
        >
          {language === "es" ? "Punto de Venta" : "Point of Sale"}
        </h2>
        <p className="text-muted-foreground">
          {language === "es"
            ? "Gestión de mesas, comandas y ventas"
            : "Tables, orders and sales management"}
        </p>
      </div>

      <div className="mb-6">
        <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-sm w-fit">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-full transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {language === "es" ? tab.labelEs : tab.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "mesas" && (
        <TablesTab
          canAddSection={role ? canAddSection(role) : true}
          canCancelDirectly={role ? canCancelAccountDirect(role) : true}
        />
      )}
      {activeTab === "comandas" &&
        (role ? canAccessPosTab(role, "comandas") : true) && <OrdersTab />}
      {activeTab === "historial" &&
        (role ? canAccessPosTab(role, "historial") : true) && <HistoryTab />}
    </>
  );
}

export function PuntoDeVentaContent({ role }: PuntoDeVentaContentProps) {
  return (
    <POSProvider>
      <POSInner role={role} />
    </POSProvider>
  );
}
