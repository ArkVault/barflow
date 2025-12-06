import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-svh w-full bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance bg-gradient-to-r from-foreground/70 via-foreground/60 to-foreground/70 bg-clip-text text-transparent">
            Barmode
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-balance max-w-3xl mx-auto">
            Sistema inteligente de gestión de inventario para bares y restaurantes con proyecciones automatizadas
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/demo">
              <Button size="lg" className="neumorphic-hover border-0 text-lg px-8">
                Ver Demo
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="neumorphic-hover border-0 text-lg px-8">
                Explorar Sistema
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <Card className="neumorphic border-0">
            <CardHeader>
              <div className="h-10 w-10 mb-4 text-primary flex items-center justify-center text-2xl">
                📦
              </div>
              <CardTitle className="text-xl">Gestión de Insumos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Control completo de tu inventario con alertas automáticas de stock mínimo
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="neumorphic border-0">
            <CardHeader>
              <div className="h-10 w-10 mb-4 text-secondary flex items-center justify-center text-2xl">
                💰
              </div>
              <CardTitle className="text-xl">Pagos & Contabilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Seguimiento de gastos vs ventas con reportes detallados
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="neumorphic border-0">
            <CardHeader>
              <div className="h-10 w-10 mb-4 text-chart-3 flex items-center justify-center text-2xl">
                📈
              </div>
              <CardTitle className="text-xl">Proyecciones IA</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Predicciones inteligentes de consumo diario, semanal y mensual
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="neumorphic border-0">
            <CardHeader>
              <div className="h-10 w-10 mb-4 text-chart-4 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <CardTitle className="text-xl">Automatización</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Actualización automática de inventario con cada venta registrada
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
