"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, ShoppingCart, Calendar } from 'lucide-react';
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from '@/lib/format';

interface SalesStatsProps {
  establishmentId: string;
}

interface Stats {
  todaySales: number;
  todayTransactions: number;
  weekSales: number;
  monthSales: number;
}

export function SalesStats({ establishmentId }: SalesStatsProps) {
  const [stats, setStats] = useState<Stats>({
    todaySales: 0,
    todayTransactions: 0,
    weekSales: 0,
    monthSales: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [todayData, weekData, monthData] = await Promise.all([
        supabase
          .from("sales")
          .select("total_price")
          .eq("establishment_id", establishmentId)
          .gte("sale_date", todayStart.toISOString()),
        supabase
          .from("sales")
          .select("total_price")
          .eq("establishment_id", establishmentId)
          .gte("sale_date", weekStart.toISOString()),
        supabase
          .from("sales")
          .select("total_price")
          .eq("establishment_id", establishmentId)
          .gte("sale_date", monthStart.toISOString()),
      ]);

      const todaySales = todayData.data?.reduce((sum, s) => sum + Number(s.total_price), 0) || 0;
      const weekSales = weekData.data?.reduce((sum, s) => sum + Number(s.total_price), 0) || 0;
      const monthSales = monthData.data?.reduce((sum, s) => sum + Number(s.total_price), 0) || 0;

      setStats({
        todaySales,
        todayTransactions: todayData.data?.length || 0,
        weekSales,
        monthSales,
      });
    };

    fetchStats();
  }, [establishmentId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="neumorphic border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ventas Hoy
          </CardTitle>
          <DollarSign className="h-5 w-5 text-chart-3" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-chart-3">{formatCurrency(stats.todaySales)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.todayTransactions} transacciones
          </p>
        </CardContent>
      </Card>

      <Card className="neumorphic border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Últimos 7 Días
          </CardTitle>
          <Calendar className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(stats.weekSales)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Promedio: {formatCurrency(stats.weekSales / 7)}/día
          </p>
        </CardContent>
      </Card>

      <Card className="neumorphic border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Este Mes
          </CardTitle>
          <TrendingUp className="h-5 w-5 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-secondary">{formatCurrency(stats.monthSales)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date().toLocaleDateString('es', { month: 'long', year: 'numeric' })}
          </p>
        </CardContent>
      </Card>

      <Card className="neumorphic border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Proyección Mensual
          </CardTitle>
          <ShoppingCart className="h-5 w-5 text-chart-4" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-chart-4">
            {formatCurrency((stats.monthSales / new Date().getDate()) * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Basado en ventas actuales
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
