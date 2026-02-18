"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import useSWR from "swr";
import { useState } from "react";
import { usePeriod } from "@/contexts/period-context";
import type { UrgentSupply, UrgencyPeriod } from "@/types/dashboard";
import { UrgencyFilterPills, type UrgencyFilter } from "@/components/presentation/urgency-filter-pills";
import { UrgencyBadge } from "@/components/presentation/urgency-badge";
import { StatusCardHeader } from "@/components/presentation/status-card-header";
import { UrgentSupplyItemCard } from "@/components/presentation/urgent-supply-item-card";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getStockRatio(current: number, min: number) {
  if (min <= 0) return 1;
  return current / min;
}

function getGaugeColor(ratio: number) {
  if (ratio >= 1) return "text-emerald-500";
  if (ratio >= 0.6) return "text-amber-500";
  return "text-red-500";
}

function SemiCircleGauge({ ratio }: { ratio: number }) {
  const clamped = Math.max(0, Math.min(ratio, 1.5));
  const percent = (clamped / 1) * 100;
  const circumference = Math.PI * 50;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  const colorClass = getGaugeColor(ratio).replace("text-", "stroke-");

  return (
    <div className="flex flex-col items-center justify-center">
      <svg viewBox="0 0 120 60" className="w-16 h-8">
        <path
          d="M10 50 A50 50 0 0 1 110 50"
          className="stroke-muted/40"
          strokeWidth={8}
          fill="none"
        />
        <path
          d="M10 50 A50 50 0 0 1 110 50"
          className={colorClass}
          strokeWidth={8}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function UrgentSuppliesAlert() {
  const { t } = useLanguage();
  const { period } = usePeriod();
  const [statusFilter, setStatusFilter] = useState<UrgencyFilter>("all");

  const { data, error, isLoading } = useSWR<{ supplies: UrgentSupply[] }>(
    `/api/supplies/urgent?period=${period}`,
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  );

  if (error) {
    return (
      <Card className="neumorphic border-0">
        <StatusCardHeader
          icon="⚠️"
          title={t("urgentSupplies")}
          description={t("errorLoadingData")}
        />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="neumorphic border-0">
        <StatusCardHeader
          icon="⚠️"
          title={t("urgentSupplies")}
          description={`${t("loading")}...`}
        />
      </Card>
    );
  }

  const urgentSupplies = data?.supplies || [];

  if (urgentSupplies.length === 0) {
    return (
      <Card className="neumorphic border-0">
        <StatusCardHeader
          icon="✅"
          title={t("healthyInventory")}
          description={t("noUrgentSupplies")}
        />
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('allSuppliesSufficient')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const criticalSupplies = urgentSupplies.filter((s) => s.urgencyLevel === 'critical');
  const warningSupplies = urgentSupplies.filter((s) => s.urgencyLevel === 'warning');
  const optimalSupplies = urgentSupplies.filter((s) => s.urgencyLevel === 'low');

  let visibleSupplies: UrgentSupply[] = urgentSupplies;

  if (statusFilter === 'critical') visibleSupplies = criticalSupplies;
  if (statusFilter === 'warning') visibleSupplies = warningSupplies;
  if (statusFilter === 'optimal') visibleSupplies = optimalSupplies;

  return (
    <Card className="neumorphic border-0">
      <StatusCardHeader
        icon="⚠️"
        title={t("urgentSupplies")}
        description={`${visibleSupplies.length} ${t("suppliesInStatus")}`}
        rightSlot={
          <UrgencyFilterPills
            value={statusFilter}
            onChange={setStatusFilter}
            counts={{
              critical: criticalSupplies.length,
              warning: warningSupplies.length,
              optimal: optimalSupplies.length,
            }}
            labels={{
              critical: t("critical"),
              warning: t("low"),
              optimal: t("good"),
              all: t("viewAll"),
            }}
          />
        }
      />
      <CardContent>
        <div className="space-y-4">
          {visibleSupplies.map((supply) => (
            <UrgentSupplyItemCard
              key={supply.id}
              supply={supply}
              labels={{
                currentStock: t("currentStock"),
                minimum: t("minimum"),
                usedIn: t("usedIn"),
              }}
              gaugeSlot={
                <div className="flex flex-col items-center text-xs text-muted-foreground">
                  <SemiCircleGauge ratio={getStockRatio(supply.current_quantity, supply.min_threshold)} />
                  <span className="mt-1">
                    {supply.current_quantity} / {supply.min_threshold} {supply.unit}
                  </span>
                </div>
              }
              badgeSlot={
                <UrgencyBadge
                  level={supply.urgencyLevel}
                  days={supply.daysUntilDepleted}
                  labels={{
                    critical: t("critical"),
                    warning: t("urgent"),
                    low: t("good"),
                  }}
                />
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
