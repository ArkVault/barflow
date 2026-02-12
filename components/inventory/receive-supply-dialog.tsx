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
import { createClient } from "@/lib/supabase/client";
import type { Supply } from "@/types";

interface ReceiveSupplyDialogProps {
  supply: Supply;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSupplyUpdated: (supply: any) => void;
}

export function ReceiveSupplyDialog({ supply, open, onOpenChange, onSupplyUpdated }: ReceiveSupplyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const quantityValue = parseFloat(quantity);
      const costValue = cost ? parseFloat(cost) : null;

      await supabase.from("supply_movements").insert({
        supply_id: supply.id,
        movement_type: "received",
        quantity: quantityValue,
        cost: costValue,
        notes: notes || null,
      });

      const { data, error: updateError } = await supabase
        .from("supplies")
        .update({
          current_quantity: supply.current_quantity + quantityValue,
          last_received_date: new Date().toISOString(),
        })
        .eq("id", supply.id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (data) onSupplyUpdated(data);

      setQuantity("");
      setCost("");
      setNotes("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al recibir stock");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neumorphic border-0">
        <DialogHeader>
          <DialogTitle>Recibir Stock</DialogTitle>
          <DialogDescription>
            Registra la entrada de stock para {supply.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Cantidad Recibida *</Label>
              <div className="flex gap-2">
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  placeholder="100"
                  className="neumorphic-inset border-0 flex-1"
                />
                <div className="neumorphic-inset px-4 flex items-center rounded-lg text-muted-foreground">
                  {supply.unit}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Stock actual: {supply.current_quantity} {supply.unit}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost">Costo Total (Opcional)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="50.00"
                className="neumorphic-inset border-0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Factura #1234, Proveedor ABC..."
                className="neumorphic-inset border-0"
                rows={3}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="neumorphic-hover border-0">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="neumorphic-hover border-0">
              {isLoading ? "Registrando..." : "Registrar Entrada"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
