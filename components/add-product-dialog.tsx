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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { GlowButton } from "@/components/glow-button";

interface Supply {
  id: string;
  name: string;
  unit: string;
}

interface Ingredient {
  supply_id: string;
  quantity_needed: string;
}

interface AddProductDialogProps {
  establishmentId: string;
  supplies: Supply[];
}

export function AddProductDialog({ establishmentId, supplies }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    category: "cocteles",
    price: "",
    description: "",
    is_active: true,
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { supply_id: "", quantity_needed: "" }
  ]);

  const addIngredient = () => {
    setIngredients([...ingredients, { supply_id: "", quantity_needed: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const validIngredients = ingredients.filter(
        ing => ing.supply_id && ing.quantity_needed
      );

      if (validIngredients.length === 0) {
        throw new Error("Debes agregar al menos un ingrediente");
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          establishment_id: establishmentId,
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          description: formData.description || null,
          is_active: formData.is_active,
        })
        .select()
        .single();

      if (productError) throw productError;

      const ingredientsToInsert = validIngredients.map(ing => ({
        product_id: product.id,
        supply_id: ing.supply_id,
        quantity_needed: parseFloat(ing.quantity_needed),
      }));

      const { error: ingredientsError } = await supabase
        .from("product_ingredients")
        .insert(ingredientsToInsert);

      if (ingredientsError) throw ingredientsError;

      setFormData({
        name: "",
        category: "cocteles",
        price: "",
        description: "",
        is_active: true,
      });
      setIngredients([{ supply_id: "", quantity_needed: "" }]);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar producto");
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
          <span className="hidden sm:inline">Nuevo Menú</span>
        </GlowButton>
      </div>
      <DialogContent className="neumorphic border-0 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Producto</DialogTitle>
          <DialogDescription>
            Crea un nuevo producto y define su receta
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Mojito Clásico"
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
                    <SelectItem value="cocteles">Cócteles</SelectItem>
                    <SelectItem value="cervezas">Cervezas</SelectItem>
                    <SelectItem value="vinos">Vinos</SelectItem>
                    <SelectItem value="shots">Shots</SelectItem>
                    <SelectItem value="bebidas-calientes">Bebidas Calientes</SelectItem>
                    <SelectItem value="sin-alcohol">Sin Alcohol</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  placeholder="12.50"
                  className="neumorphic-inset border-0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="is_active" className="mb-2">Estado</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <div className="grid gap-2 col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Refrescante cóctel cubano con ron, menta, lima..."
                  className="neumorphic-inset border-0"
                  rows={2}
                />
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Ingredientes de la Receta *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                  className="neumorphic-hover border-0 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Ingrediente
                </Button>
              </div>
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => {
                  const selectedSupply = supplies.find(s => s.id === ingredient.supply_id);
                  return (
                    <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
                      <div className="grid gap-2">
                        <Label htmlFor={`supply-${index}`}>Insumo</Label>
                        <Select
                          value={ingredient.supply_id}
                          onValueChange={(value) => updateIngredient(index, "supply_id", value)}
                        >
                          <SelectTrigger className="neumorphic-inset border-0">
                            <SelectValue placeholder="Seleccionar insumo" />
                          </SelectTrigger>
                          <SelectContent>
                            {supplies.map((supply) => (
                              <SelectItem key={supply.id} value={supply.id}>
                                {supply.name} ({supply.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2 w-32">
                        <Label htmlFor={`quantity-${index}`}>Cantidad</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            step="0.01"
                            value={ingredient.quantity_needed}
                            onChange={(e) => updateIngredient(index, "quantity_needed", e.target.value)}
                            placeholder="50"
                            className="neumorphic-inset border-0"
                          />
                          {selectedSupply && (
                            <div className="neumorphic-inset px-3 flex items-center rounded-lg text-xs text-muted-foreground whitespace-nowrap">
                              {selectedSupply.unit}
                            </div>
                          )}
                        </div>
                      </div>
                      {ingredients.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIngredient(index)}
                          className="neumorphic-hover h-10 w-10 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="neumorphic-hover border-0">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="neumorphic-hover border-0">
              {isLoading ? "Guardando..." : "Guardar Producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
