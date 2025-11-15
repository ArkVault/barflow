import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DemoPage() {
  return (
    <div className="min-h-svh bg-background">
      {/* Navigation */}
      <nav className="border-b neumorphic-inset">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BarFlow
              </h1>
            </Link>
            <div className="flex gap-2">
              <Link href="/"><Button variant="outline" className="neumorphic-hover border-0">Volver</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Overview */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Panel de Control</h2>
          <p className="text-muted-foreground">Vista general de tu negocio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="neumorphic border-0">
            <CardHeader className="pb-3">
              <CardDescription>Total Insumos</CardDescription>
              <CardTitle className="text-3xl">48</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">5 con stock bajo</p>
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

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/demo/insumos">
            <Card className="neumorphic border-0 hover:scale-105 transition-transform cursor-pointer">
              <CardHeader>
                <div className="text-4xl mb-2">📦</div>
                <CardTitle>Insumos</CardTitle>
                <CardDescription>Gestionar inventario y stock</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/demo/productos">
            <Card className="neumorphic border-0 hover:scale-105 transition-transform cursor-pointer">
              <CardHeader>
                <div className="text-4xl mb-2">🍹</div>
                <CardTitle>Productos</CardTitle>
                <CardDescription>Menú y recetas</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/demo/ventas">
            <Card className="neumorphic border-0 hover:scale-105 transition-transform cursor-pointer">
              <CardHeader>
                <div className="text-4xl mb-2">💰</div>
                <CardTitle>Ventas</CardTitle>
                <CardDescription>Registrar y ver ventas</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/demo/proyecciones">
            <Card className="neumorphic border-0 hover:scale-105 transition-transform cursor-pointer">
              <CardHeader>
                <div className="text-4xl mb-2">📊</div>
                <CardTitle>Proyecciones</CardTitle>
                <CardDescription>Análisis predictivo IA</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
