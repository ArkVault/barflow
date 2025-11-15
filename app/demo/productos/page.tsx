import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const products = [
  { id: 1, name: 'Mojito Clásico', category: 'Cócteles', price: 8.50, ingredients: 5, active: true },
  { id: 2, name: 'Margarita', category: 'Cócteles', price: 9.00, ingredients: 4, active: true },
  { id: 3, name: 'Piña Colada', category: 'Cócteles', price: 10.00, ingredients: 6, active: true },
  { id: 4, name: 'Cuba Libre', category: 'Cócteles', price: 7.50, ingredients: 3, active: true },
  { id: 5, name: 'Cerveza Corona', category: 'Cervezas', price: 5.00, ingredients: 1, active: true },
  { id: 6, name: 'Tequila Shot', category: 'Shots', price: 6.00, ingredients: 2, active: true },
]

export default function ProductosPage() {
  return (
    <div className="min-h-svh bg-background">
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

      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Gestión de Productos</h2>
            <p className="text-muted-foreground">Menú y recetas de bebidas</p>
          </div>
          <Button className="neumorphic-hover border-0">+ Añadir Producto</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="neumorphic border-0">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                  {product.active && <Badge className="bg-green-600">Activo</Badge>}
                </div>
                <CardDescription>{product.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary">${product.price}</span>
                    <span className="text-sm text-muted-foreground">{product.ingredients} ingredientes</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 neumorphic-hover border-0" size="sm">Ver Receta</Button>
                    <Button variant="outline" className="flex-1 neumorphic-hover border-0" size="sm">Editar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
