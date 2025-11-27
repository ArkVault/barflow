"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Supply {
  id: string;
  name: string;
  category: string;
  current_quantity: number;
  unit: string;
  min_threshold: number;
  optimal_quantity?: number;
  content_per_unit?: number;
  content_unit?: string;
  brand?: string;
}

interface EditSupplyDialogProps {
  supply: Supply | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const categories = [
  "Licores",
  "Licores Dulces",
  "Refrescos",
  "Frutas",
  "Hierbas",
  "Especias",
  "Otros",
];

const units = ["L", "ml", "kg", "g", "units", "oz", "bottles"];
const contentUnits = ["ml", "L", "g", "kg", "oz", "units"];

export function EditSupplyDialog({
  supply,
  open,
  onOpenChange,
  onSuccess,
}: EditSupplyDialogProps) {
  const [formData, setFormData] = useState<Partial<Supply>>({});
  const [loading, setLoading] = useState(false);

  // Update form data when supply changes
  useEffect(() => {
    if (supply) {
      setFormData({
        name: supply.name,
        category: supply.category,
        current_quantity: supply.current_quantity,
        unit: supply.unit,
        min_threshold: supply.min_threshold,
        optimal_quantity: supply.optimal_quantity || 0,
        content_per_unit: supply.content_per_unit || 1,
        content_unit: supply.content_unit || 'ml',
        brand: supply.brand || '',
      });
    }
  }, [supply]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supply) return;

    setLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("supplies")
        .update({
          name: formData.name,
          category: formData.category,
          current_quantity: formData.current_quantity,
          unit: formData.unit,
          min_threshold: formData.min_threshold,
          optimal_quantity: formData.optimal_quantity,
          content_per_unit: formData.content_per_unit,
          content_unit: formData.content_unit,
          brand: formData.brand,
          updated_at: new Date().toISOString(),
        })
        .eq("id", supply.id);

      if (error) throw error;

      toast.success("Insumo actualizado correctamente");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating supply:", error);
      toast.error("Error al actualizar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Insumo</DialogTitle>
            <DialogDescription>
              Modifica los datos del insumo {supply?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit">Unidad</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Brand Field */}
            <div className="grid gap-2">
              <Label htmlFor="brand">Marca (opcional)</Label>
              <Input
                id="brand"
                value={formData.brand || ""}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                placeholder="Ej: Bacardi, Havana Club, etc."
              />
              <p className="text-xs text-muted-foreground">
                Especifica la marca para matching exacto con productos
              </p>
            </div>

            {/* Content Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="content_per_unit">Contenido por Unidad</Label>
                <Input
                  id="content_per_unit"
                  type="number"
                  step="0.01"
                  value={formData.content_per_unit || 1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content_per_unit: parseFloat(e.target.value),
                    })
                  }
                  placeholder="750"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content_unit">Unidad de Contenido</Label>
                <Select
                  value={formData.content_unit || 'ml'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, content_unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Ejemplo: Botella de 750ml → Contenido: 750ml
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Cantidad Total</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={formData.current_quantity || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      current_quantity: parseFloat(e.target.value),
                    })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground -mt-1">
                  Total en {formData.content_unit || 'unidades'}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="optimal">Cantidad Óptima</Label>
                <Input
                  id="optimal"
                  type="number"
                  step="0.01"
                  value={formData.optimal_quantity || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      optimal_quantity: parseFloat(e.target.value),
                    })
                  }
                  placeholder="Stock ideal"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="min">Mínimo</Label>
                <Input
                  id="min"
                  type="number"
                  step="0.01"
                  value={formData.min_threshold || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_threshold: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
