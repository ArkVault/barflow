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
import { AlertTriangle } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";

interface Supply {
  id: string;
  name: string;
}

interface DeleteSupplyDialogProps {
  supply: Supply;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSupplyDeleted: (id: string) => void;
}

export function DeleteSupplyDialog({ supply, open, onOpenChange, onSupplyDeleted }: DeleteSupplyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("supplies")
        .delete()
        .eq("id", supply.id);

      if (error) throw error;
      onSupplyDeleted(supply.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar insumo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neumorphic border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Insumo
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el insumo y todos sus movimientos asociados.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">
            ¿Estás seguro de que deseas eliminar <strong>{supply.name}</strong>?
          </p>
        </div>
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="neumorphic-hover border-0">
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="neumorphic-hover border-0"
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
