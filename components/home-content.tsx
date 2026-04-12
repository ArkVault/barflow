"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { calculateStockStatus } from "@/lib/stock-utils";
import type { SupplyWithStatus } from "@/types/supply";
import { SuppliesService } from "@/lib/services/supplies.service";
import { MenusService } from "@/lib/services/menus.service";
import { ProductsService } from "@/lib/services/products.service";
import { SalesService } from "@/lib/services/sales.service";

const SalesChartSimple = dynamic(
  () =>
    import("@/components/sales-chart-simple").then(
      (mod) => mod.SalesChartSimple,
    ),
  {
    loading: () => (
      <div className="h-[160px] w-full animate-pulse bg-muted/20 rounded-lg" />
    ),
    ssr: false,
  },
);
const InventoryProjectionChart = dynamic(
  () =>
    import("@/components/inventory-projection-chart").then(
      (mod) => mod.InventoryProjectionChart,
    ),
  {
    loading: () => (
      <div className="h-[160px] w-full animate-pulse bg-muted/20 rounded-lg" />
    ),
    ssr: false,
  },
);
const NeonDonutChart = dynamic(
  () =>
    import("@/components/neon-donut-chart").then((mod) => mod.NeonDonutChart),
  {
    loading: () => (
      <div className="h-[120px] w-full animate-pulse bg-muted/20 rounded-full" />
    ),
    ssr: false,
  },
);

interface TopProduct {
  product_name: string;
  total_sales: number;
}

interface HomeContentProps {
  insumosHref: string;
  productosHref: string;
  plannerRedirect: string;
}

export function HomeContent({
  insumosHref,
  productosHref,
  plannerRedirect,
}: HomeContentProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { establishmentId, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [, setSupplies] = useState<SupplyWithStatus[]>([]);
  const [totalSupplies, setTotalSupplies] = useState(0);
  const [criticalSupplies, setCriticalSupplies] = useState(0);
  const [lowSupplies, setLowSupplies] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeMenuName, setActiveMenuName] = useState("Sin menú activo");
  const [, setActiveMenuProductsCount] = useState(0);
  const [menuLastModified, setMenuLastModified] = useState("Nunca");
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [planPeriod, setPlanPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    if (!authLoading && establishmentId) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establishmentId, authLoading]);

  const loadDashboardData = async () => {
    if (!establishmentId) return;

    try {
      setLoading(true);
      const supabase = createClient();

      const { data: activeMenus, error: menusError } =
        await MenusService.getActive(supabase as any, establishmentId);

      if (menusError) throw menusError;

      const menuIds = (activeMenus || []).map((m) => m.id);
      const primaryMenu = activeMenus?.find((m) => m.is_active);

      const [suppliesRes, productsRes, salesRes] = await Promise.all([
        SuppliesService.getAll(supabase as any, establishmentId, {
          orderBy: "name",
          ascending: true,
        }),
        menuIds.length > 0
          ? ProductsService.getActiveDashboardProductsByMenuIds(
              supabase as any,
              menuIds,
            )
          : Promise.resolve({ data: [], error: null }),
        SalesService.getRecentForDashboard(
          supabase as any,
          establishmentId,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        ),
      ]);

      if (suppliesRes.error) throw suppliesRes.error;
      const suppliesData = suppliesRes.data || [];

      if (suppliesData.length === 0) {
        router.push(plannerRedirect);
        return;
      }

      let critical = 0;
      let low = 0;
      const suppliesWithStatus = suppliesData.map((supply) => {
        const status = calculateStockStatus(supply);
        if (status === "critical") critical++;
        else if (status === "low") low++;
        return { ...supply, status };
      });

      setSupplies(suppliesWithStatus);
      setTotalSupplies(suppliesData.length);
      setCriticalSupplies(critical);
      setLowSupplies(low);

      const productsData = productsRes.data || [];
      setTotalProducts(productsData.length);

      if (primaryMenu) {
        setActiveMenuName(primaryMenu.name);
        const primaryMenuProducts = productsData.filter(
          (p) => p.menu_id === primaryMenu.id,
        );
        setActiveMenuProductsCount(primaryMenuProducts.length);
      } else {
        setActiveMenuName("Sin menú activo");
        setActiveMenuProductsCount(0);
      }

      if (productsData.length > 0 && productsData[0].updated_at) {
        const lastModified = new Date(productsData[0].updated_at);
        const diffDays = Math.ceil(
          Math.abs(new Date().getTime() - lastModified.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (diffDays === 0) setMenuLastModified(t("today"));
        else if (diffDays === 1) setMenuLastModified(t("yesterday"));
        else if (diffDays < 7)
          setMenuLastModified(t("daysAgo").replace("{days}", String(diffDays)));
        else if (diffDays < 30)
          setMenuLastModified(
            t("weeksAgo").replace("{weeks}", String(Math.floor(diffDays / 7))),
          );
        else
          setMenuLastModified(
            t("monthsAgo").replace(
              "{months}",
              String(Math.floor(diffDays / 30)),
            ),
          );
      }

      const salesData = salesRes.data || [];
      const salesByProduct: Record<string, { name: string; total: number }> =
        {};

      salesData.forEach((sale: any) => {
        const items = sale.items || [];
        items.forEach((item: any) => {
          const productName =
            item.productName ||
            item.name ||
            item.product_name ||
            "Producto Desconocido";
          const quantity = item.quantity || 1;
          if (!salesByProduct[productName]) {
            salesByProduct[productName] = { name: productName, total: 0 };
          }
          salesByProduct[productName].total += quantity;
        });
      });

      setTopProducts(
        Object.values(salesByProduct)
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
          .map((p) => ({ product_name: p.name, total_sales: p.total })),
      );
    } catch (error: any) {
      console.error("Error loading dashboard:", error);
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">
            {t("loadingDashboard")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
          <div>
            <h2
              className="text-4xl font-bold mb-2"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              {t("dashboardDemo")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("businessOverviewDesc")}
            </p>
          </div>

          {/* Period Selector */}
          <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-sm w-fit">
            <button
              type="button"
              onClick={() => setPlanPeriod("week")}
              className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${
                planPeriod === "week"
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📅 {t("week")}
            </button>
            <button
              type="button"
              onClick={() => setPlanPeriod("month")}
              className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${
                planPeriod === "month"
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📆 {t("month")}
            </button>
          </div>
        </div>
      </div>

      {/* Top Row: Inventario + Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        {/* Inventario */}
        <Card className="neumorphic border-0 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-1 px-3 pt-2">
            <CardTitle className="text-xs font-bold">
              {t("inventory")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-2 h-[240px] flex flex-col justify-between">
            <div className="flex-1 flex items-center justify-center">
              <NeonDonutChart
                critical={criticalSupplies}
                low={lowSupplies}
                optimal={totalSupplies - criticalSupplies - lowSupplies}
              />
            </div>
            <Link href={insumosHref} className="mt-auto pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-[10px] h-6 hover:bg-primary/10 hover:text-primary"
              >
                {t("viewFullInventory")} →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Productos */}
        <Card className="neumorphic border-0 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-0 px-3 pt-2">
            <CardTitle className="text-xs font-bold">{t("products")}</CardTitle>
            <CardDescription className="text-[10px]">
              {t("currentMenu")}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-2 h-[240px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between w-full mb-1 pb-1 border-b border-border/30">
              <div className="flex items-center gap-2">
                <p
                  className="text-xl font-black text-primary leading-none"
                  style={{
                    fontFamily: "Satoshi, sans-serif",
                    textShadow: "0 0 12px rgba(var(--primary-rgb), 0.4)",
                  }}
                >
                  {totalProducts}
                </p>
                <span className="text-[9px] text-muted-foreground">
                  {t("inMenu")}
                </span>
              </div>
              <div className="text-right text-[8px] text-muted-foreground leading-tight">
                <div>{activeMenuName}</div>
                <div className="opacity-70">{menuLastModified}</div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <p className="text-xs font-bold text-center mb-1.5 text-foreground">
                🔥 {t("topSelling")}
              </p>
              {topProducts.length > 0 ? (
                <div className="space-y-1 flex-1 overflow-hidden">
                  {topProducts.slice(0, 5).map((product, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between px-2.5 py-1 rounded text-xs ${
                        index === 0
                          ? "bg-amber-500/10 border border-amber-500/20"
                          : index === 1
                            ? "bg-slate-400/10 border border-slate-400/15"
                            : index === 2
                              ? "bg-amber-700/10 border border-amber-700/15"
                              : "bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                        <span
                          className={`font-bold flex-shrink-0 ${
                            index === 0
                              ? "text-amber-500"
                              : index === 1
                                ? "text-slate-400"
                                : index === 2
                                  ? "text-amber-700"
                                  : "text-muted-foreground"
                          }`}
                        >
                          {index === 0
                            ? "🥇"
                            : index === 1
                              ? "🥈"
                              : index === 2
                                ? "🥉"
                                : `#${index + 1}`}
                        </span>
                        <span className="font-medium truncate">
                          {product.product_name}
                        </span>
                      </div>
                      <span
                        className={`font-bold whitespace-nowrap ml-1 ${
                          index === 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {product.total_sales}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground text-center">
                    {language === "es"
                      ? "Sin ventas registradas"
                      : "No sales recorded"}
                  </p>
                </div>
              )}
            </div>

            <Link href={productosHref} className="mt-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-[9px] h-5 hover:bg-primary/10 hover:text-primary"
              >
                {t("viewAllProducts")} →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Ventas + Proyecciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <SalesChartSimple period={planPeriod === "week" ? "week" : "month"} />
        <InventoryProjectionChart period={planPeriod} highSeason={false} />
      </div>

      {/* Info Text */}
      <div className="p-2 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>{t("controlPanel")}</strong> - {t("businessSummary")}.
          {t("goToSupplies")}{" "}
          <Link
            href={insumosHref}
            className="text-primary hover:underline font-medium"
          >
            {t("supplies")}
          </Link>
          .
        </p>
      </div>
    </>
  );
}
