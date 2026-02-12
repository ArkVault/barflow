"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from 'lucide-react';
import { EditSupplyDialog } from "./edit-supply-dialog";
import { ReceiveSupplyDialog } from "./receive-supply-dialog";
import { DeleteSupplyDialog } from "./delete-supply-dialog";
import type { Supply } from "@/types";

interface SuppliesTableProps {
  supplies: Supply[];
}

// Helper function to convert quantities to display units
const getDisplayQuantity = (supply: Supply) => {
  // If content_per_unit is defined, show in units (bottles, kg, etc.)
  if (supply.content_per_unit && supply.content_per_unit > 0) {
    const units = supply.current_quantity / supply.content_per_unit;

    // Determine display unit based on category and content_unit
    let displayUnit = 'unidades';
    let displayValue = units;

    const category = supply.category?.toLowerCase() || '';
    const contentUnit = supply.content_unit?.toLowerCase() || supply.unit?.toLowerCase() || '';

    // Check category first for more accurate unit determination
    if (category.includes('otro') || category === 'otros') {
      // Otros: always show in gramos
      displayValue = supply.current_quantity;
      displayUnit = 'g';
    } else if (category.includes('fruta') || category.includes('fruit')) {
      // Frutas: always show in kg
      const kg = supply.current_quantity / 1000;
      displayValue = kg;
      displayUnit = 'kg';
    } else if (category.includes('especia') || category.includes('spice')) {
      // Especias: show in gramos if less than 1kg, otherwise kg
      const kg = supply.current_quantity / 1000;
      if (kg < 1) {
        displayValue = supply.current_quantity;
        displayUnit = 'g';
      } else {
        displayValue = kg;
        displayUnit = 'kg';
      }
    } else if (category.includes('licor') || category.includes('alcohol') || (category.includes('bebida') && contentUnit.includes('ml'))) {
      // Licores y bebidas alcohólicas: show in bottles
      displayValue = units;
      displayUnit = Math.floor(units) === 1 ? 'botella' : 'botellas';
    } else if (category.includes('refresco') || category.includes('no alcohólica') || category.includes('agua')) {
      // Refrescos y agua: show in bottles or liters
      if (contentUnit === 'l' || supply.content_per_unit >= 1000) {
        displayValue = supply.current_quantity / 1000;
        displayUnit = displayValue === 1 ? 'litro' : 'litros';
      } else {
        displayValue = units;
        displayUnit = Math.floor(units) === 1 ? 'botella' : 'botellas';
      }
    } else if (contentUnit === 'ml' || contentUnit === 'l') {
      // Default for liquids: show in bottles
      displayValue = units;
      displayUnit = Math.floor(units) === 1 ? 'botella' : 'botellas';
    } else if (contentUnit === 'g') {
      // Weight in grams: convert to kg for display
      const kg = supply.current_quantity / 1000;
      displayValue = kg;
      displayUnit = 'kg';
    } else if (contentUnit === 'kg') {
      displayValue = supply.current_quantity;
      displayUnit = 'kg';
    }

    // Format the display value
    const formattedValue = displayValue % 1 === 0
      ? displayValue.toFixed(0)
      : displayValue.toFixed(1);

    return `${formattedValue} ${displayUnit}`;
  }

  // Fallback to original quantity display
  return `${supply.current_quantity} ${supply.unit}`;
};

export function SuppliesTable({ supplies: initialSupplies }: SuppliesTableProps) {
  const [supplies, setSupplies] = useState(initialSupplies);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [receivingSupply, setReceivingSupply] = useState<Supply | null>(null);
  const [deletingSupply, setDeletingSupply] = useState<Supply | null>(null);

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { label: "Sin stock", variant: "destructive" as const };
    if (current <= min) return { label: "Stock bajo", variant: "secondary" as const };
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
                        {getDisplayQuantity(supply)}
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
          onSuccess={() => window.location.reload()}
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
