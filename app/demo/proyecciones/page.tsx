'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { DemoSidebar } from "@/components/demo-sidebar"
import { useLanguage } from "@/hooks/use-language"

const projections = {
  day: [
    { supply: 'Ron Blanco', current: 12, needed: 2.5, days: 4.8, status: 'ok' },
    { supply: 'Vodka Premium', current: 8, needed: 3.2, days: 2.5, status: 'low' },
    { supply: 'Jugo de Limón', current: 25, needed: 4.0, days: 6.25, status: 'ok' },
    { supply: 'Azúcar', current: 5, needed: 2.8, days: 1.8, status: 'critical' },
  ],
  week: [
    { supply: 'Ron Blanco', current: 12, needed: 17.5, days: 4.8, status: 'critical' },
    { supply: 'Vodka Premium', current: 8, needed: 22.4, days: 2.5, status: 'critical' },
    { supply: 'Jugo de Limón', current: 25, needed: 28.0, days: 6.25, status: 'low' },
    { supply: 'Azúcar', current: 5, needed: 19.6, days: 1.8, status: 'critical' },
  ],
  month: [
    { supply: 'Ron Blanco', current: 12, needed: 70, days: 4.8, status: 'critical' },
    { supply: 'Vodka Premium', current: 8, needed: 89.6, days: 2.5, status: 'critical' },
    { supply: 'Jugo de Limón', current: 25, needed: 112, days: 6.25, status: 'critical' },
    { supply: 'Azúcar', current: 5, needed: 78.4, days: 1.8, status: 'critical' },
  ]
}

export default function ProyeccionesPage() {
  const { t } = useLanguage();

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>{t('smartProjections')}</h2>
              <p className="text-muted-foreground">{t('aiPredictiveAnalysis')}</p>
            </div>
            <Button className="neumorphic-hover border-0">🔄 {t('updateProjections')}</Button>
          </div>

          <Tabs defaultValue="day" className="w-full">
            <TabsList className="neumorphic border-0 mb-6">
              <TabsTrigger value="day">{t('day')}</TabsTrigger>
              <TabsTrigger value="week">{t('week')}</TabsTrigger>
              <TabsTrigger value="month">{t('month')}</TabsTrigger>
            </TabsList>

            <TabsContent value="day" className="space-y-4">
              <Card className="neumorphic border-0 mb-6">
                <CardHeader>
                  <CardTitle>Proyección Diaria</CardTitle>
                  <CardDescription>Consumo estimado para las próximas 24 horas</CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-4">
                {projections.day.map((item, index) => (
                  <Card key={index} className="neumorphic border-0">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{item.supply}</h3>
                          <p className="text-sm text-muted-foreground">
                            Stock actual: {item.current} L • Necesitas: {item.needed} L
                          </p>
                        </div>
                        <div className="text-right">
                          {item.status === 'ok' && <Badge className="bg-green-600">Bien</Badge>}
                          {item.status === 'low' && <Badge className="bg-amber-600">Atención</Badge>}
                          {item.status === 'critical' && <Badge variant="destructive">Crítico</Badge>}
                        </div>
                      </div>
                      <Progress value={(item.current / (item.current + item.needed)) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Duración estimada: {item.days.toFixed(1)} días
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="week" className="space-y-4">
              <Card className="neumorphic border-0 mb-6">
                <CardHeader>
                  <CardTitle>Proyección Semanal</CardTitle>
                  <CardDescription>Consumo estimado para los próximos 7 días</CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-4">
                {projections.week.map((item, index) => (
                  <Card key={index} className="neumorphic border-0">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{item.supply}</h3>
                          <p className="text-sm text-muted-foreground">
                            Stock actual: {item.current} L • Necesitas: {item.needed} L
                          </p>
                        </div>
                        <div className="text-right">
                          {item.status === 'ok' && <Badge className="bg-green-600">Bien</Badge>}
                          {item.status === 'low' && <Badge className="bg-amber-600">Atención</Badge>}
                          {item.status === 'critical' && <Badge variant="destructive">Crítico</Badge>}
                        </div>
                      </div>
                      <Progress value={(item.current / (item.current + item.needed)) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        ⚠️ Necesitas comprar {(item.needed - item.current).toFixed(1)} L más
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="month" className="space-y-4">
              <Card className="neumorphic border-0 mb-6">
                <CardHeader>
                  <CardTitle>Proyección Mensual</CardTitle>
                  <CardDescription>Consumo estimado para los próximos 30 días</CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-4">
                {projections.month.map((item, index) => (
                  <Card key={index} className="neumorphic border-0">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{item.supply}</h3>
                          <p className="text-sm text-muted-foreground">
                            Stock actual: {item.current} L • Necesitas: {item.needed} L
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">Crítico</Badge>
                        </div>
                      </div>
                      <Progress value={(item.current / (item.current + item.needed)) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        🛒 Necesitas comprar {(item.needed - item.current).toFixed(1)} L más
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
