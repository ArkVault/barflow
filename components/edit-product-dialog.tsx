"use client";

import { useState, useRef } from "react";
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
import { Plus, X, Upload, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { optimizeImage, isValidImageFile } from "@/lib/image-optimizer";

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
  image_url?: string | null;
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
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product.image_url || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("La imagen debe ser menor a 10MB");
        return;
      }
      if (!isValidImageFile(file)) {
        toast.error("Solo se permiten archivos de imagen (JPG, PNG, WebP, GIF)");
        return;
      }

      try {
        setIsOptimizing(true);
        toast.info("Optimizando imagen...");

        // Optimize image for products (larger than thumbnails)
        const optimizedFile = await optimizeImage(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800, // Good size for product images
          fileType: 'image/webp'
        });

        setSelectedFile(optimizedFile);
        setRemoveImage(false);

        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(optimizedFile);

        const originalSizeKB = Math.round(file.size / 1024);
        const optimizedSizeKB = Math.round(optimizedFile.size / 1024);
        toast.success(`Imagen optimizada: ${originalSizeKB}KB → ${optimizedSizeKB}KB`);
      } catch (error) {
        console.error("Error optimizing image:", error);
        toast.error("Error al optimizar la imagen");
      } finally {
        setIsOptimizing(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper to extract file path from Supabase storage URL
  const getStoragePathFromUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    try {
      const match = url.match(/\/products\/(product-images\/[^?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  // Delete image from Supabase storage
  const deleteOldImage = async (imageUrl: string | null | undefined): Promise<void> => {
    if (!imageUrl) return;

    const filePath = getStoragePathFromUrl(imageUrl);
    if (!filePath) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.storage
        .from('products')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting old image:', error);
      } else {
        console.log('Old image deleted:', filePath);
      }
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  };

  const uploadImage = async (file: File, oldImageUrl?: string | null): Promise<string | null> => {
    const supabase = createClient();

    // Delete old image first if it exists
    if (oldImageUrl) {
      await deleteOldImage(oldImageUrl);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${product.id}-${Date.now()}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Error al subir la imagen");
    }

    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

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

      // Handle image upload/removal
      let imageUrl = product.image_url;

      if (removeImage) {
        // Delete old image from storage when removing
        if (product.image_url) {
          await deleteOldImage(product.image_url);
        }
        imageUrl = null;
      } else if (selectedFile) {
        // Upload new image (will delete old one automatically)
        imageUrl = await uploadImage(selectedFile, product.image_url);
      }

      const { error: productError } = await supabase
        .from("products")
        .update({
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          description: formData.description || null,
          is_active: formData.is_active,
          image_url: imageUrl,
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
      toast.success("Producto actualizado correctamente");
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
            {/* Image Upload Section */}
            <div className="space-y-3">
              <Label>Imagen del Producto</Label>
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div
                  className="relative w-32 h-32 rounded-xl neumorphic-inset flex items-center justify-center overflow-hidden cursor-pointer group"
                  onClick={() => !isOptimizing && fileInputRef.current?.click()}
                >
                  {isOptimizing ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-xs">Optimizando...</span>
                    </div>
                  ) : imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-xs">Sin imagen</span>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isOptimizing}
                    className="neumorphic-hover border-0 gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {imagePreview ? "Cambiar" : "Subir"} Imagen
                  </Button>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="neumorphic-hover border-0 gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG o WebP. Se optimiza automáticamente.
                  </p>
                </div>
              </div>
            </div>

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

