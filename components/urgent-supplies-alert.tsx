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
import { SupplyStockGaugeCaption } from "@/components/presentation/supply-stock-gauge-caption";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
                <SupplyStockGaugeCaption
                  currentQuantity={supply.current_quantity}
                  minThreshold={supply.min_threshold}
                  unit={supply.unit}
                  variant="prod"
                />
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
