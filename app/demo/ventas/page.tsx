'use client';

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DemoSidebar } from "@/components/demo-sidebar"
import { useLanguage } from "@/hooks/use-language"

const sales = [
  { id: 1, date: '2024-11-25', time: '18:45', product: 'Mojito Clásico', unitPrice: 8.50, quantity: 2, total: 17.00 },
  { id: 2, date: '2024-11-25', time: '18:52', product: 'Margarita', unitPrice: 9.00, quantity: 1, total: 9.00 },
  { id: 3, date: '2024-11-25', time: '19:10', product: 'Cerveza Corona', unitPrice: 5.00, quantity: 4, total: 20.00 },
  { id: 4, date: '2024-11-25', time: '19:25', product: 'Piña Colada', unitPrice: 10.00, quantity: 2, total: 20.00 },
  { id: 5, date: '2024-11-25', time: '19:40', product: 'Cuba Libre', unitPrice: 7.50, quantity: 3, total: 22.50 },
  { id: 6, date: '2024-11-25', time: '20:05', product: 'Tequila Shot', unitPrice: 6.00, quantity: 6, total: 36.00 },
]

export default function VentasPage() {
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
              <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>{t('salesAccounting')}</h2>
              <p className="text-muted-foreground">{t('transactionLog')}</p>
            </div>
            <Button className="neumorphic-hover border-0">+ {t('registerSale')}</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="neumorphic border-0 p-6">
              <div className="text-sm text-muted-foreground mb-1">Ventas Hoy</div>
              <div className="text-3xl font-bold text-green-600">$4,250</div>
              <div className="text-xs text-muted-foreground mt-1">+15% vs ayer</div>
            </Card>
            <Card className="neumorphic border-0 p-6">
              <div className="text-sm text-muted-foreground mb-1">Transacciones</div>
              <div className="text-3xl font-bold">87</div>
              <div className="text-xs text-muted-foreground mt-1">Hoy</div>
            </Card>
            <Card className="neumorphic border-0 p-6">
              <div className="text-sm text-muted-foreground mb-1">Ticket Promedio</div>
              <div className="text-3xl font-bold">$48.85</div>
              <div className="text-xs text-muted-foreground mt-1">+8% vs ayer</div>
            </Card>
          </div>

          <Card className="neumorphic border-0 mb-6">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">{t('recentTransactions')}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>{t('time')}</TableHead>
                    <TableHead>{t('product')}</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>{t('quantity')}</TableHead>
                    <TableHead className="text-right">{t('total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{new Date(sale.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                      <TableCell>{sale.time}</TableCell>
                      <TableCell className="font-medium">{sale.product}</TableCell>
                      <TableCell>${sale.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>{sale.quantity}x</TableCell>
                      <TableCell className="text-right font-bold">${sale.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
