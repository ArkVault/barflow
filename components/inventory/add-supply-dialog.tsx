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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { GlowButton } from "@/components/layout/glow-button";

interface AddSupplyDialogProps {
  establishmentId: string;
}

export function AddSupplyDialog({ establishmentId }: AddSupplyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    category: "licores",
    unit: "ml",
    current_quantity: "",
    min_threshold: "",
    cost_per_unit: "",
    supplier: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("supplies").insert({
        establishment_id: establishmentId,
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        current_quantity: parseFloat(formData.current_quantity) || 0,
        min_threshold: parseFloat(formData.min_threshold) || 0,
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
        supplier: formData.supplier || null,
        last_received_date: new Date().toISOString(),
      });

      if (error) throw error;

      setFormData({
        name: "",
        category: "licores",
        unit: "ml",
        current_quantity: "",
        min_threshold: "",
        cost_per_unit: "",
        supplier: "",
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar insumo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)} className="inline-block cursor-pointer">
        <GlowButton onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-inner">
            <Plus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          </div>
          <span className="hidden sm:inline">Añadir Insumo</span>
        </GlowButton>
      </div>

      <DialogContent className="neumorphic border-0 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Insumo</DialogTitle>
          <DialogDescription>
            Registra un nuevo insumo en tu inventario
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ron Blanco"
                className="neumorphic-inset border-0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Categoría</Label>
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
              <Label htmlFor="current_quantity">Cantidad Actual *</Label>
              <Input
                id="current_quantity"
                type="number"
                step="0.01"
                value={formData.current_quantity}
                onChange={(e) => setFormData({ ...formData, current_quantity: e.target.value })}
                required
                placeholder="1000"
                className="neumorphic-inset border-0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unidad *</Label>
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
              <Label htmlFor="min_threshold">Stock Mínimo *</Label>
              <Input
                id="min_threshold"
                type="number"
                step="0.01"
                value={formData.min_threshold}
                onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                required
                placeholder="200"
                className="neumorphic-inset border-0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost_per_unit">Costo por Unidad</Label>
              <Input
                id="cost_per_unit"
                type="number"
                step="0.01"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                placeholder="0.50"
                className="neumorphic-inset border-0"
              />
            </div>
            <div className="grid gap-2 col-span-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Distribuidora XYZ"
                className="neumorphic-inset border-0"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="neumorphic-hover border-0">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="neumorphic-hover border-0">
              {isLoading ? "Guardando..." : "Guardar Insumo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
