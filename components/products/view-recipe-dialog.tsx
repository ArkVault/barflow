"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";
import { formatCurrency } from '@/lib/format';

interface ViewRecipeDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewRecipeDialog({ product, open, onOpenChange }: ViewRecipeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neumorphic border-0 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-balance">{product.name}</DialogTitle>
          <DialogDescription>
            {product.description || "Receta del producto"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="neumorphic-inset px-4 py-2 rounded-lg">
              <span className="text-sm text-muted-foreground mr-2">Precio:</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(product.price)}</span>
            </div>
            {product.category && (
              <Badge variant="secondary" className="capitalize text-sm">
                {product.category}
              </Badge>
            )}
            <Badge variant={product.is_active ? "default" : "outline"} className="text-sm">
              {product.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Ingredientes</h3>
            <div className="space-y-3">
              {(product.product_ingredients ?? []).map((ingredient) => (
                <div
                  key={ingredient.id}
                  className="neumorphic-inset p-4 rounded-lg flex items-center justify-between"
                >
                  <span className="font-medium">{ingredient.supplies?.name}</span>
                  <span className="text-muted-foreground">
                    {ingredient.quantity_needed} {ingredient.supplies?.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
