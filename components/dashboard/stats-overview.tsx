"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import useSWR from "swr";
import { formatCurrency } from '@/lib/format';

interface Stats {
  totalProducts: number;
  lowStockCount: number;
  totalSalesToday: number;
  monthlyRevenue: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function StatsOverview() {
  const { t } = useLanguage();
  const { data, error, isLoading } = useSWR<Stats>(
    '/api/stats',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  const stats = data || {
    totalProducts: 0,
    lowStockCount: 0,
    totalSalesToday: 0,
    monthlyRevenue: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="neumorphic border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('productsTotal')}
          </CardTitle>
          <span className="text-2xl">📦</span>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {isLoading ? '...' : stats.totalProducts}
          </div>
        </CardContent>
      </Card>

      <Card className="neumorphic border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('lowStock')}
          </CardTitle>
          <span className="text-2xl">⚠️</span>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-amber-500">
            {isLoading ? '...' : stats.lowStockCount}
          </div>
        </CardContent>
      </Card>

      <Card className="neumorphic border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('salesToday')}
          </CardTitle>
          <span className="text-2xl">💰</span>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {isLoading ? '...' : formatCurrency(stats.totalSalesToday)}
          </div>
        </CardContent>
      </Card>

      <Card className="neumorphic border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('monthlyRevenue')}
          </CardTitle>
          <span className="text-2xl">📈</span>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {isLoading ? '...' : formatCurrency(stats.monthlyRevenue)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
