"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";

interface UrgentSupply {
  id: string;
  name: string;
  current_quantity: number;
  min_threshold: number;
  unit: string;
  category: string;
  daysUntilDepleted: number;
  urgencyLevel: 'critical' | 'warning' | 'low';
  products: {
    name: string;
    category: string;
    quantityNeeded: number;
  }[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function UrgentSuppliesAlert() {
  const { data, error, isLoading } = useSWR<{ supplies: UrgentSupply[] }>(
    '/api/supplies/urgent',
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  );

  if (error) {
    return (
      <Card className="neumorphic border-0">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            ⚠️ Insumos Urgentes
          </CardTitle>
          <CardDescription>Error al cargar los datos</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="neumorphic border-0">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            ⚠️ Insumos Urgentes Esta Semana
          </CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const urgentSupplies = data?.supplies || [];

  if (urgentSupplies.length === 0) {
    return (
      <Card className="neumorphic border-0">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            ✅ Inventario Saludable
          </CardTitle>
          <CardDescription>No hay insumos críticos esta semana</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Todos los insumos tienen stock suficiente para la semana.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getUrgencyBadge = (level: string, days: number) => {
    if (level === 'critical') {
      return <Badge variant="destructive" className="neumorphic-inset">Crítico ({days}d)</Badge>;
    } else if (level === 'warning') {
      return <Badge className="neumorphic-inset bg-amber-500 text-white">Urgente ({days}d)</Badge>;
    } else {
      return <Badge variant="secondary" className="neumorphic-inset">Atención ({days}d)</Badge>;
    }
  };

  return (
    <Card className="neumorphic border-0">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          ⚠️ Insumos Urgentes Esta Semana
        </CardTitle>
        <CardDescription>
          {urgentSupplies.length} insumo{urgentSupplies.length !== 1 ? 's' : ''} necesita{urgentSupplies.length === 1 ? '' : 'n'} reabastecimiento pronto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {urgentSupplies.map((supply) => (
            <div
              key={supply.id}
              className="neumorphic-inset p-4 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-lg">{supply.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {supply.category}
                  </p>
                </div>
                {getUrgencyBadge(supply.urgencyLevel, supply.daysUntilDepleted)}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Stock actual:</span>
                  <span className="ml-2 font-medium">
                    {supply.current_quantity} {supply.unit}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mínimo:</span>
                  <span className="ml-2 font-medium">
                    {supply.min_threshold} {supply.unit}
                  </span>
                </div>
              </div>

              {supply.products.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    Utilizado en:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {supply.products.map((product, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs neumorphic"
                      >
                        {product.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
