'use client';

import { LayoutGrid, FileText, History } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/contexts/auth-context";
import { ProdShell } from "@/components/shells";
import { POSProvider, usePOS, TablesTab, OrdersTab, HistoryTab } from "@/components/pos";

const TABS = [
  { id: "mesas", labelEs: "Mesas", labelEn: "Tables", icon: LayoutGrid },
  { id: "comandas", labelEs: "Comandas", labelEn: "Orders", icon: FileText },
  { id: "historial", labelEs: "Registro", labelEn: "History", icon: History },
] as const;

type TabId = (typeof TABS)[number]["id"];

function OperacionesContent() {
  const { t, language } = useLanguage();
  const { activeTab, setActiveTab } = usePOS();
  const { user, establishmentName } = useAuth();

  return (
    <ProdShell
      userName={user?.email || "Usuario"}
      establishmentName={establishmentName || "Mi Negocio"}
      pageTitle={t("operations")}
      pageDescription={language === "es" ? "Gestión de mesas, comandas y ventas" : "Tables, orders and sales management"}
    >
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-sm w-fit">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as TabId)}
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

          {activeTab === "mesas" && <TablesTab />}
          {activeTab === "comandas" && <OrdersTab />}
          {activeTab === "historial" && <HistoryTab />}
        </div>
      </div>
    </ProdShell>
  );
}

export default function OperacionesPage() {
  return (
    <POSProvider>
      <OperacionesContent />
    </POSProvider>
  );
}
