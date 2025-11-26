'use client'

import { useState } from 'react';
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DemoSidebar } from "@/components/demo-sidebar"
import { useLanguage } from "@/hooks/use-language"
import { InventoryProjectionChart } from "@/components/inventory-projection-chart"
import { SalesProjectionChart } from "@/components/sales-projection-chart"
import { OrderSuggestionsTable } from "@/components/order-suggestions-table"
import { RefreshCw } from "lucide-react"

export default function ProyeccionesPage() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

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

      <div className="min-h-screen bg-background p-6 ml-0 md:ml-20 lg:ml-72">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {t('smartProjections')}
              </h2>
              <p className="text-muted-foreground">{t('aiPredictiveAnalysis')}</p>
            </div>
            <Button
              className="neumorphic-hover border-0"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('updateProjections')}
            </Button>
          </div>

          {/* Period Selector */}
          <Tabs value={period} onValueChange={(value) => setPeriod(value as 'week' | 'month')} className="w-full mb-6">
            <TabsList className="neumorphic border-0">
              <TabsTrigger value="week">{t('week')}</TabsTrigger>
              <TabsTrigger value="month">{t('month')}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Charts Section */}
          <div className="space-y-6 mb-8">
            <InventoryProjectionChart period={period} />
            <SalesProjectionChart period={period} />
          </div>

          {/* Order Suggestions Table */}
          <div className="mb-8">
            <OrderSuggestionsTable period={period} />
          </div>

          {/* Info Card */}
          <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-muted">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Las proyecciones se calculan automáticamente basándose en el historial de ventas
              y consumo de inventario. Los pedidos sugeridos se actualizan diariamente para optimizar tu stock.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
