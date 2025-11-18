"use client";

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DemoSidebar } from "@/components/demo-sidebar";
import { UrgentSuppliesAlertDemo } from "@/components/urgent-supplies-alert-demo";
import { StockTrafficLightDemo } from "@/components/stock-traffic-light-demo";
import { PeriodProvider } from "@/contexts/period-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";

export default function DemoPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [hasPlann, setHasPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSupplies, setTotalSupplies] = useState(0);
  const [planPeriod, setPlanPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    // Check if user has completed the planner
    const planData = localStorage.getItem("barflow_plan");
    if (!planData) {
      router.push("/demo/planner");
    } else {
      setHasPlan(true);
      setIsLoading(false);
      
      try {
        const plan = JSON.parse(planData);
        const selectedCount = plan.supplies.filter((s: any) => s.selected).length;
        setTotalSupplies(selectedCount);
        setPlanPeriod(plan.period || 'week');
      } catch {
        setTotalSupplies(0);
      }
    }
  }, [router]);

  if (isLoading || !hasPlann) {
    return null;
  }
  return (
    <PeriodProvider>
    <div className="min-h-svh bg-background">
      <DemoSidebar />

      <div className="min-h-svh flex flex-col">
        {/* Navigation */}
        <nav className="border-b neumorphic-inset bg-background/80 backdrop-blur">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BarFlow Demo
              </h1>
            </Link>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="neumorphic-hover border-0"
                onClick={() => {
                  localStorage.removeItem("barflow_plan");
                  router.push("/demo/planner");
                }}
              >
                ⚙️ {t('reconfigurePlan')}
              </Button>
              <Link href="/">
                <Button variant="outline" className="neumorphic-hover border-0">
                  {t('back')}
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Dashboard Overview */}
        <main className="container mx-auto px-6 py-8 ml-0 md:ml-20 lg:ml-72">
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">{t('dashboardDemo')}</h2>
                <p className="text-muted-foreground">
                  {t('dashboardDemo')}
                </p>
              </div>
              <Badge variant="outline" className="text-sm px-3 py-1">
                Plan: {planPeriod === 'week' ? `📅 ${t('week')}` : `📆 ${t('month')}`}
              </Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="neumorphic border-0">
              <CardHeader className="pb-3">
                <CardDescription>{t('totalSupplies')}</CardDescription>
                <CardTitle className="text-3xl">{totalSupplies}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t('configuredInPlan')}</p>
              </CardContent>
            </Card>

            <Card className="neumorphic border-0">
              <CardHeader className="pb-3">
                <CardDescription>Ventas Hoy</CardDescription>
                <CardTitle className="text-3xl">$4,250</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-600">+15% vs ayer</p>
              </CardContent>
            </Card>

            <Card className="neumorphic border-0">
              <CardHeader className="pb-3">
                <CardDescription>Productos</CardDescription>
                <CardTitle className="text-3xl">24</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Cócteles y bebidas</p>
              </CardContent>
            </Card>

            <Card className="neumorphic border-0">
              <CardHeader className="pb-3">
                <CardDescription>Proyección Semanal</CardDescription>
                <CardTitle className="text-3xl">$28K</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Basado en IA</p>
              </CardContent>
            </Card>
          </div>

          {/* Period Selector and Traffic Light */}
          <div className="mb-6">
            <StockTrafficLightDemo />
          </div>

          <div className="max-w-4xl">
            <UrgentSuppliesAlertDemo />
          </div>
        </main>
      </div>
    </div>
    </PeriodProvider>
  )
}
