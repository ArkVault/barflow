"use client";

import { useState } from "react";
import { InventoryProjectionChart } from "@/components/inventory-projection-chart";
import { SalesProjectionChart } from "@/components/sales-projection-chart";
import { ROICalculator } from "@/components/roi/roi-calculator";
import {
  Package,
  TrendingUp,
  Calculator,
  CalendarDays,
  CalendarRange,
} from "lucide-react";

// ── Tab Configuration ──

const MAIN_TABS = [
  { id: "inventory", label: "Proyección de Inventario", icon: Package },
  { id: "sales", label: "Proyección de Ventas", icon: TrendingUp },
  { id: "roi", label: "Calculadora ROI", icon: Calculator },
] as const;

type MainTabId = (typeof MAIN_TABS)[number]["id"];

const PERIOD_TABS = [
  { id: "week", label: "Semanal", icon: CalendarDays },
  { id: "month", label: "Mensual", icon: CalendarRange },
] as const;

type PeriodId = "week" | "month";

// ── Pill Tabs Component ──

function PillTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: readonly { id: T; label: string; icon: React.ElementType }[];
  activeTab: T;
  onTabChange: (id: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-sm w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-2.5 rounded-full transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ──

export function ProyeccionesTabs() {
  const [activeTab, setActiveTab] = useState<MainTabId>("inventory");
  const [inventoryPeriod, setInventoryPeriod] = useState<PeriodId>("week");
  const [salesPeriod, setSalesPeriod] = useState<PeriodId>("week");

  return (
    <div className="space-y-6">
      {/* Main Tabs — pill style matching POS */}
      <PillTabs
        tabs={MAIN_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Inventory Projection */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <PillTabs
            tabs={PERIOD_TABS}
            activeTab={inventoryPeriod}
            onTabChange={setInventoryPeriod}
          />
          <InventoryProjectionChart
            period={inventoryPeriod}
            highSeason={false}
          />
        </div>
      )}

      {/* Sales Projection */}
      {activeTab === "sales" && (
        <div className="space-y-4">
          <PillTabs
            tabs={PERIOD_TABS}
            activeTab={salesPeriod}
            onTabChange={setSalesPeriod}
          />
          <SalesProjectionChart period={salesPeriod} highSeason={false} />
        </div>
      )}

      {/* ROI Calculator */}
      {activeTab === "roi" && <ROICalculator />}
    </div>
  );
}
