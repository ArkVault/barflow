import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const supplies = [
  { id: 1, name: 'Ron Blanco', category: 'Licores', quantity: 12, unit: 'L', min: 10, status: 'ok' },
  { id: 2, name: 'Vodka Premium', category: 'Licores', quantity: 8, unit: 'L', min: 10, status: 'low' },
  { id: 3, name: 'Jugo de Limón', category: 'Refrescos', quantity: 25, unit: 'L', min: 15, status: 'ok' },
  { id: 4, name: 'Azúcar', category: 'Especias', quantity: 5, unit: 'kg', min: 8, status: 'critical' },
  { id: 5, name: 'Hierbabuena', category: 'Frutas', quantity: 2, unit: 'kg', min: 3, status: 'low' },
  { id: 6, name: 'Tequila Reposado', category: 'Licores', quantity: 15, unit: 'L', min: 10, status: 'ok' },
  { id: 7, name: 'Coca Cola', category: 'Refrescos', quantity: 48, unit: 'L', min: 30, status: 'ok' },
  { id: 8, name: 'Limones', category: 'Frutas', quantity: 1.5, unit: 'kg', min: 3, status: 'critical' },
]

export default function InsumosPage() {
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
            <h2 className="text-3xl font-bold mb-2">Gestión de Insumos</h2>
            <p className="text-muted-foreground">Control de inventario y stock</p>
          </div>
          <Button className="neumorphic-hover border-0">+ Añadir Insumo</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="neumorphic border-0 p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Insumos</div>
            <div className="text-3xl font-bold">48</div>
          </Card>
          <Card className="neumorphic border-0 p-6">
            <div className="text-sm text-muted-foreground mb-1">Stock Bajo</div>
            <div className="text-3xl font-bold text-amber-600">5</div>
          </Card>
          <Card className="neumorphic border-0 p-6">
            <div className="text-sm text-muted-foreground mb-1">Stock Crítico</div>
            <div className="text-3xl font-bold text-destructive">2</div>
          </Card>
        </div>

        <Card className="neumorphic border-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplies.map((supply) => (
                <TableRow key={supply.id}>
                  <TableCell className="font-medium">{supply.name}</TableCell>
                  <TableCell>{supply.category}</TableCell>
                  <TableCell>{supply.quantity} {supply.unit}</TableCell>
                  <TableCell>{supply.min} {supply.unit}</TableCell>
                  <TableCell>
                    {supply.status === 'ok' && <Badge className="bg-green-600">Bien</Badge>}
                    {supply.status === 'low' && <Badge className="bg-amber-600">Stock Bajo</Badge>}
                    {supply.status === 'critical' && <Badge variant="destructive">Crítico</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Editar</Button>
                    <Button variant="ghost" size="sm">Recibir</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
