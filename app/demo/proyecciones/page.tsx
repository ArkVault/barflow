'use client'

import { useState } from 'react';
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DemoSidebar } from "@/components/demo-sidebar"
import { useLanguage } from "@/hooks/use-language"
import dynamic from 'next/dynamic';
import { OrderSuggestionsTable } from "@/components/order-suggestions-table"

// Dynamic imports para optimizar carga
const InventoryProjectionChart = dynamic(() => import("@/components/inventory-projection-chart").then(mod => mod.InventoryProjectionChart), {
  loading: () => <div className="h-[340px] w-full animate-pulse bg-muted/20 rounded-lg" />,
  ssr: false
});
const SalesProjectionChart = dynamic(() => import("@/components/sales-projection-chart").then(mod => mod.SalesProjectionChart), {
  loading: () => <div className="h-[340px] w-full animate-pulse bg-muted/20 rounded-lg" />,
  ssr: false
});
import { RefreshCw, Flame } from "lucide-react"

export default function ProyeccionesPage() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [highSeason, setHighSeason] = useState(false);

  const handleRefresh = () => {
    // TODO: Implementar lógica de actualización de proyecciones
    console.log('Actualizando proyecciones...');
  };

  return (
    <div className="min-h-svh bg-background">
      <DemoSidebar />
      <nav className="border-b neumorphic-inset">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/demo">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BarFlow
              </h1>
            </Link>
            <Link href="/demo"><Button variant="outline" className="neumorphic-hover border-0">← Dashboard</Button></Link>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-background p-4 ml-0 md:ml-20 lg:ml-72">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {t('smartProjections')}
              </h2>
              <p className="text-muted-foreground">{t('aiPredictiveAnalysis')}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                className="neumorphic-hover border-0"
                onClick={handleRefresh}
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('updateProjections')}
              </Button>
            </div>
          </div>

          {/* Controls Section */}
          <Card className="neumorphic border-0 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Period Selector */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">Temporalidad:</Label>
                  <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-sm w-fit">
                    <button
                      type="button"
                      onClick={() => setPeriod("week")}
                      className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${period === "week"
                        ? "bg-background text-foreground shadow-sm font-medium"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      📅 {t('week')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPeriod("month")}
                      className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${period === "month"
                        ? "bg-background text-foreground shadow-sm font-medium"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      📆 {t('month')}
                    </button>
                  </div>
                </div>

                {/* High Season Toggle */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Flame className={`w-5 h-5 ${highSeason ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  <div className="flex flex-col">
                    <Label htmlFor="high-season" className="text-sm font-medium cursor-pointer">
                      Temporada Alta
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {highSeason ? 'Demanda aumentada (+30-40%)' : 'Demanda normal'}
                    </span>
                  </div>
                  <Switch
                    id="high-season"
                    checked={highSeason}
                    onCheckedChange={setHighSeason}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="space-y-6 mb-8">
            <InventoryProjectionChart period={period} highSeason={highSeason} />
            <SalesProjectionChart period={period} highSeason={highSeason} />
          </div>

          {/* Order Suggestions Table */}
          <div className="mb-8">
            <OrderSuggestionsTable period={period} />
          </div>

          {/* Info Card */}
          <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-muted">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>📊 Metodología:</strong> Las proyecciones utilizan <strong>regresión lineal</strong> sobre datos históricos
              para estimar tendencias futuras de inventario y ventas.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>🔥 Temporada Alta:</strong> Activa este modo durante períodos de alta demanda (festividades, eventos especiales)
              para ajustar las proyecciones automáticamente. Los pedidos sugeridos se actualizan en tiempo real.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
