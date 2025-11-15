"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from 'lucide-react';
import { EditSupplyDialog } from "@/components/edit-supply-dialog";
import { ReceiveSupplyDialog } from "@/components/receive-supply-dialog";
import { DeleteSupplyDialog } from "@/components/delete-supply-dialog";

interface Supply {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  current_quantity: number;
  min_threshold: number;
  cost_per_unit: number | null;
  supplier: string | null;
  last_received_date: string | null;
}

interface SuppliesTableProps {
  supplies: Supply[];
}

export function SuppliesTable({ supplies: initialSupplies }: SuppliesTableProps) {
  const [supplies, setSupplies] = useState(initialSupplies);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [receivingSupply, setReceivingSupply] = useState<Supply | null>(null);
  const [deletingSupply, setDeletingSupply] = useState<Supply | null>(null);

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { label: "Sin stock", variant: "destructive" as const };
    if (current <= min) return { label: "Stock bajo", variant: "warning" as const };
    return { label: "En stock", variant: "default" as const };
  };

  const handleSupplyUpdated = (updatedSupply: Supply) => {
    setSupplies(prev => prev.map(s => s.id === updatedSupply.id ? updatedSupply : s));
  };

  const handleSupplyDeleted = (deletedId: string) => {
    setSupplies(prev => prev.filter(s => s.id !== deletedId));
  };

  if (supplies.length === 0) {
    return (
      <Card className="neumorphic border-0">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">No hay insumos registrados</p>
          <p className="text-sm text-muted-foreground">
            Comienza agregando tu primer insumo usando el botón superior
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="neumorphic border-0">
        <CardHeader>
          <CardTitle>Inventario Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Categoría</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Cantidad</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Mínimo</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Costo/Unidad</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {supplies.map((supply) => {
                  const status = getStockStatus(supply.current_quantity, supply.min_threshold);
                  return (
                    <tr key={supply.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{supply.name}</td>
                      <td className="py-3 px-4 text-muted-foreground capitalize">
                        {supply.category || "-"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {supply.current_quantity} {supply.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {supply.min_threshold} {supply.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {supply.cost_per_unit ? `$${supply.cost_per_unit}` : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setReceivingSupply(supply)}
                            title="Recibir stock"
                            className="neumorphic-hover h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSupply(supply)}
                            title="Editar"
                            className="neumorphic-hover h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingSupply(supply)}
                            title="Eliminar"
                            className="neumorphic-hover h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {editingSupply && (
        <EditSupplyDialog
          supply={editingSupply}
          open={!!editingSupply}
          onOpenChange={(open) => !open && setEditingSupply(null)}
          onSupplyUpdated={handleSupplyUpdated}
        />
      )}

      {receivingSupply && (
        <ReceiveSupplyDialog
          supply={receivingSupply}
          open={!!receivingSupply}
          onOpenChange={(open) => !open && setReceivingSupply(null)}
          onSupplyUpdated={handleSupplyUpdated}
        />
      )}

      {deletingSupply && (
        <DeleteSupplyDialog
          supply={deletingSupply}
          open={!!deletingSupply}
          onOpenChange={(open) => !open && setDeletingSupply(null)}
          onSupplyDeleted={handleSupplyDeleted}
        />
      )}
    </>
  );
}
