"use client";

import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { LayoutGrid, FileText, History } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useStaff } from "@/contexts/staff-context";
import {
  canAccessPosTab,
  canAddSection,
  canCancelAccountDirect,
} from "@/lib/roles";
import { ProdShell } from "@/components/shells";

import {
  POSProvider,
  usePOS,
  TablesTab,
  OrdersTab,
  HistoryTab,
} from "@/components/pos";

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

function POSContent() {
  const { language } = useLanguage();
  const { user, establishmentName } = useAuth();
  const { role } = useStaff();
  const { activeTab, setActiveTab } = usePOS();

  const visibleTabs = TABS.filter((tab) => canAccessPosTab(role, tab.id));

  // If current active tab is not allowed for this role, reset to first allowed
  useEffect(() => {
    if (!canAccessPosTab(role, activeTab as TabId)) {
      setActiveTab("mesas");
    }
  }, [role, activeTab, setActiveTab]);

  return (
    <ProdShell
      userName={user?.email || "Usuario"}
      establishmentName={establishmentName || "Mi Negocio"}
    >
      <div className="p-6 max-w-5xl mx-auto">
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

        {/* Tabs */}
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

        {/* Tab Content */}
        {activeTab === "mesas" && (
          <TablesTab
            canAddSection={canAddSection(role)}
            canCancelDirectly={canCancelAccountDirect(role)}
          />
        )}
        {activeTab === "comandas" && canAccessPosTab(role, "comandas") && (
          <OrdersTab />
        )}
        {activeTab === "historial" && canAccessPosTab(role, "historial") && (
          <HistoryTab />
        )}
      </div>
    </ProdShell>
  );
}

export default function PuntoDeVentaPage() {
  return (
    <POSProvider>
      <POSContent />
    </POSProvider>
  );
}
