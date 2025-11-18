"use client";

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DemoSidebar } from "@/components/demo-sidebar"
import { useState } from "react"
import { useLanguage } from "@/hooks/use-language"

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

type StatusFilter = 'all' | 'critical' | 'low' | 'ok';

export default function InsumosPage() {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // Helper function to translate category
  const translateCategory = (category: string) => {
    const categoryMap: Record<string, string> = {
      'Licores': t('liquors'),
      'Refrescos': t('refreshments'),
      'Especias': t('spices'),
      'Frutas': t('fruits'),
    };
    return categoryMap[category] || category;
  };
  
  const criticalCount = supplies.filter(s => s.status === 'critical').length;
  const lowCount = supplies.filter(s => s.status === 'low').length;
  const okCount = supplies.filter(s => s.status === 'ok').length;
  
  const filteredSupplies = statusFilter === 'all' 
    ? supplies 
    : supplies.filter(s => s.status === statusFilter);
  
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

      <div className="container mx-auto px-6 py-8 ml-0 md:ml-20 lg:ml-72">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">{t('supplyManagement')}</h2>
            <p className="text-muted-foreground">{t('inventoryControl')}</p>
          </div>
          <Button className="neumorphic-hover border-0">+ {t('addSupply')}</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card 
            className={`neumorphic border-0 p-6 cursor-pointer transition-all hover:scale-105 ${
              statusFilter === 'critical' ? 'ring-2 ring-destructive' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
          >
            <div className="text-sm text-muted-foreground mb-1">{t('criticalStock')}</div>
            <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
          </Card>
          <Card 
            className={`neumorphic border-0 p-6 cursor-pointer transition-all hover:scale-105 ${
              statusFilter === 'low' ? 'ring-2 ring-amber-500' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
          >
            <div className="text-sm text-muted-foreground mb-1">{t('lowStock')}</div>
            <div className="text-3xl font-bold text-amber-600">{lowCount}</div>
          </Card>
          <Card 
            className={`neumorphic border-0 p-6 cursor-pointer transition-all hover:scale-105 ${
              statusFilter === 'ok' ? 'ring-2 ring-green-500' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'ok' ? 'all' : 'ok')}
          >
            <div className="text-sm text-muted-foreground mb-1">{t('goodStock')}</div>
            <div className="text-3xl font-bold text-green-600">{okCount}</div>
          </Card>
          <Card 
            className={`neumorphic border-0 p-6 cursor-pointer transition-all hover:scale-105 ${
              statusFilter === 'all' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setStatusFilter('all')}
          >
            <div className="text-sm text-muted-foreground mb-1">{t('allSupplies')}</div>
            <div className="text-3xl font-bold">{supplies.length}</div>
          </Card>
        </div>

        <Card className="neumorphic border-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('category')}</TableHead>
                <TableHead>{t('quantity')}</TableHead>
                <TableHead>{t('unit')}</TableHead>
                <TableHead>{t('minimum')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSupplies.map((supply) => (
                <TableRow key={supply.id}>
                  <TableCell className="font-medium">{supply.name}</TableCell>
                  <TableCell>{translateCategory(supply.category)}</TableCell>
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
