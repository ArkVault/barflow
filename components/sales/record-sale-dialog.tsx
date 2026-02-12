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
import type { Product } from "@/types";
import { formatCurrency } from '@/lib/format';

/** This dialog requires price to be present on every product. */
type SaleProduct = Product & { price: number };

interface RecordSaleDialogProps {
  establishmentId: string;
  products: SaleProduct[];
}

export function RecordSaleDialog({ establishmentId, products }: RecordSaleDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const totalPrice = selectedProduct ? selectedProduct.price * Number(quantity) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!selectedProductId) {
        throw new Error("Debes seleccionar un producto");
      }

      const supabase = createClient();
      const { error } = await supabase.from("sales").insert({
        establishment_id: establishmentId,
        product_id: selectedProductId,
        quantity: parseInt(quantity),
        total_price: totalPrice,
        sale_date: new Date().toISOString(),
      });

      if (error) throw error;

      setSelectedProductId("");
      setQuantity("1");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar venta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="neumorphic-hover border-0 gap-2">
          <Plus className="h-4 w-4" />
          Registrar Venta
        </Button>
      </DialogTrigger>
      <DialogContent className="neumorphic border-0 max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Venta</DialogTitle>
          <DialogDescription>
            Registra una venta y actualiza automáticamente el inventario
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">Producto *</Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
                required
              >
                <SelectTrigger className="neumorphic-inset border-0">
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="neumorphic-inset border-0"
              />
            </div>

            {selectedProduct && (
              <div className="neumorphic-inset p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio unitario:</span>
                  <span className="font-medium">{formatCurrency(selectedProduct.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cantidad:</span>
                  <span className="font-medium">{quantity}</span>
                </div>
                <div className="border-t border-border pt-2 mt-2 flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold text-chart-3">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="neumorphic-hover border-0">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !selectedProductId} className="neumorphic-hover border-0">
              {isLoading ? "Registrando..." : "Registrar Venta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
