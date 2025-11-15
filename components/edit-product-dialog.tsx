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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";

interface Supply {
  id: string;
  name: string;
  unit: string;
}

interface ProductIngredient {
  id: string;
  quantity_needed: number;
  supply_id: string;
  supplies: Supply;
}

interface Product {
  id: string;
  name: string;
  category: string | null;
  price: number;
  description: string | null;
  is_active: boolean;
  product_ingredients: ProductIngredient[];
}

interface Ingredient {
  id?: string;
  supply_id: string;
  quantity_needed: string;
}

interface EditProductDialogProps {
  product: Product;
  supplies: Supply[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: (product: Product) => void;
}

export function EditProductDialog({ product, supplies, open, onOpenChange, onProductUpdated }: EditProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category || "cocteles",
    price: product.price.toString(),
    description: product.description || "",
    is_active: product.is_active,
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(
    product.product_ingredients.map(ing => ({
      id: ing.id,
      supply_id: ing.supply_id,
      quantity_needed: ing.quantity_needed.toString(),
    }))
  );

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
        throw new Error("Debes tener al menos un ingrediente");
      }

      const { error: productError } = await supabase
        .from("products")
        .update({
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          description: formData.description || null,
          is_active: formData.is_active,
        })
        .eq("id", product.id);

      if (productError) throw productError;

      await supabase
        .from("product_ingredients")
        .delete()
        .eq("product_id", product.id);

      const ingredientsToInsert = validIngredients.map(ing => ({
        product_id: product.id,
        supply_id: ing.supply_id,
        quantity_needed: parseFloat(ing.quantity_needed),
      }));

      const { error: ingredientsError } = await supabase
        .from("product_ingredients")
        .insert(ingredientsToInsert);

      if (ingredientsError) throw ingredientsError;

      const { data: updatedProduct } = await supabase
        .from("products")
        .select(`
          *,
          product_ingredients (
            id,
            quantity_needed,
            supply_id,
            supplies (
              id,
              name,
              unit
            )
          )
        `)
        .eq("id", product.id)
        .single();

      if (updatedProduct) onProductUpdated(updatedProduct);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar producto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neumorphic border-0 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription>
            Modifica los detalles del producto y su receta
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre del Producto *</Label>
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
                <Label htmlFor="edit-price">Precio *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="neumorphic-inset border-0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-is-active" className="mb-2">Estado</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    id="edit-is-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <div className="grid gap-2 col-span-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="neumorphic-inset border-0"
                  rows={2}
                />
              </div>
            </div>

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
                        <Label>Insumo</Label>
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
                        <Label>Cantidad</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={ingredient.quantity_needed}
                            onChange={(e) => updateIngredient(index, "quantity_needed", e.target.value)}
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
