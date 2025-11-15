"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface Supply {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  current_quantity: number;
  min_threshold: number;
  cost_per_unit: number | null;
  supplier: string | null;
}

interface EditSupplyDialogProps {
  supply: Supply;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSupplyUpdated: (supply: Supply) => void;
}

export function EditSupplyDialog({ supply, open, onOpenChange, onSupplyUpdated }: EditSupplyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: supply.name,
    category: supply.category || "licores",
    unit: supply.unit,
    min_threshold: supply.min_threshold.toString(),
    cost_per_unit: supply.cost_per_unit?.toString() || "",
    supplier: supply.supplier || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("supplies")
        .update({
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          min_threshold: parseFloat(formData.min_threshold),
          cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
          supplier: formData.supplier || null,
        })
        .eq("id", supply.id)
        .select()
        .single();

      if (error) throw error;
      if (data) onSupplyUpdated(data);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar insumo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neumorphic border-0 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Insumo</DialogTitle>
          <DialogDescription>
            Modifica los detalles del insumo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="neumorphic-inset border-0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="neumorphic-inset border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="licores">Licores</SelectItem>
                  <SelectItem value="refrescos">Refrescos</SelectItem>
                  <SelectItem value="frutas">Frutas</SelectItem>
                  <SelectItem value="especias">Especias</SelectItem>
                  <SelectItem value="hielo">Hielo</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-unit">Unidad *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger className="neumorphic-inset border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ml">Mililitros (ml)</SelectItem>
                  <SelectItem value="l">Litros (l)</SelectItem>
                  <SelectItem value="g">Gramos (g)</SelectItem>
                  <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                  <SelectItem value="unidad">Unidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-min-threshold">Stock Mínimo *</Label>
              <Input
                id="edit-min-threshold"
                type="number"
                step="0.01"
                value={formData.min_threshold}
                onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                required
                className="neumorphic-inset border-0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-cost-per-unit">Costo por Unidad</Label>
              <Input
                id="edit-cost-per-unit"
                type="number"
                step="0.01"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                className="neumorphic-inset border-0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-supplier">Proveedor</Label>
              <Input
                id="edit-supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="neumorphic-inset border-0"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="neumorphic-hover border-0">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="neumorphic-hover border-0">
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
