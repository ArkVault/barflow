"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Product } from "@/types";
import { formatCurrency } from '@/lib/format';

/** Sale shape specific to this table, where Supabase joins the product. */
interface SalesTableSale {
  id: string;
  quantity: number;
  total_price: number;
  sale_date: string;
  products: Product;
}

interface SalesTableProps {
  sales: SalesTableSale[];
}

export function SalesTable({ sales }: SalesTableProps) {
  if (sales.length === 0) {
    return (
      <Card className="neumorphic border-0">
        <CardHeader>
          <CardTitle>Historial de Ventas</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay ventas registradas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="neumorphic border-0">
      <CardHeader>
        <CardTitle>Historial de Ventas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Producto</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Categoría</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Cantidad</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                  <td className="py-3 px-4 font-medium">{sale.products.name}</td>
                  <td className="py-3 px-4">
                    {sale.products.category ? (
                      <Badge variant="secondary" className="capitalize">
                        {sale.products.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">{sale.quantity}</td>
                  <td className="py-3 px-4 text-right font-semibold text-chart-3">
                    {formatCurrency(Number(sale.total_price))}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(sale.sale_date), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
