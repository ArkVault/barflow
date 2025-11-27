"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";

interface Supply {
    id: string;
    name: string;
    category: string;
    current_quantity: number;
    unit: string;
    min_threshold: number;
    optimal_quantity?: number;
}

interface RestockSupplyDialogProps {
    supply: Supply | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddToCart: (item: PurchaseItem) => void;
}

export interface PurchaseItem {
    supplyId: string;
    supplyName: string;
    unit: string;
    quantityToOrder: number;
    status: 'pending' | 'ordered' | 'received';
    addedAt: string;
}

export function RestockSupplyDialog({ supply, open, onOpenChange, onAddToCart }: RestockSupplyDialogProps) {
    const [quantity, setQuantity] = useState(0);

    useEffect(() => {
        if (supply && open) {
            // Calculate suggested quantity (difference between optimal and current)
            const suggested = supply.optimal_quantity
                ? Math.max(0, supply.optimal_quantity - supply.current_quantity)
                : Math.max(0, supply.min_threshold - supply.current_quantity);
            setQuantity(suggested);
        }
    }, [supply, open]);

    const handleAddToCart = () => {
        if (!supply || quantity <= 0) {
            toast.error("La cantidad debe ser mayor a 0");
            return;
        }

        const purchaseItem: PurchaseItem = {
            supplyId: supply.id,
            supplyName: supply.name,
            unit: supply.unit,
            quantityToOrder: quantity,
            status: 'pending',
            addedAt: new Date().toISOString()
        };

        onAddToCart(purchaseItem);
        toast.success(`${supply.name} agregado a la lista de compras`);
        onOpenChange(false);
    };

    if (!supply) return null;

    const suggestedQuantity = supply.optimal_quantity
        ? Math.max(0, supply.optimal_quantity - supply.current_quantity)
        : Math.max(0, supply.min_threshold - supply.current_quantity);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] neumorphic border-0">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                        Abastecer Insumo
                    </DialogTitle>
                    <DialogDescription>
                        Agrega este insumo a tu lista de compras
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Supply Info */}
                    <div className="neumorphic-inset p-4 rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg">{supply.name}</h3>
                                <p className="text-sm text-muted-foreground">{supply.category}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Cantidad actual</p>
                                <p className="font-bold text-lg">{supply.current_quantity} {supply.unit}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Cantidad óptima</p>
                                <p className="font-bold text-lg">
                                    {supply.optimal_quantity || supply.min_threshold} {supply.unit}
                                </p>
                            </div>
                        </div>

                        {suggestedQuantity > 0 && (
                            <div className="mt-3 p-2 bg-primary/10 rounded-md">
                                <p className="text-xs text-primary font-medium">
                                    💡 Sugerencia: Pedir {suggestedQuantity} {supply.unit} para alcanzar el nivel óptimo
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-sm font-medium">
                            Cantidad a pedir
                        </Label>
                        <div className="flex gap-2 items-center">
                            <Input
                                id="quantity"
                                type="number"
                                min="0"
                                step="0.1"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="text-lg font-semibold"
                            />
                            <span className="text-muted-foreground font-medium min-w-[40px]">
                                {supply.unit}
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="neumorphic-hover"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAddToCart}
                        disabled={quantity <= 0}
                        className="neumorphic-hover"
                    >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Agregar a lista de compras
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
