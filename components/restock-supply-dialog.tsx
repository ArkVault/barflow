"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    content_per_unit?: number;
    content_unit?: string;
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

type DisplayUnit = 'botellas' | 'kg' | 'litros' | 'gramos' | 'ml';

export function RestockSupplyDialog({ supply, open, onOpenChange, onAddToCart }: RestockSupplyDialogProps) {
    const [quantity, setQuantity] = useState(0);
    const [displayUnit, setDisplayUnit] = useState<DisplayUnit>('botellas');

    // Determine available units based on supply category/content_unit
    const getAvailableUnits = (): DisplayUnit[] => {
        if (!supply) return ['botellas'];

        const contentUnit = supply.content_unit || supply.unit;

        if (contentUnit === 'ml' || contentUnit === 'L') {
            return ['botellas', 'litros', 'ml'];
        } else if (contentUnit === 'g' || contentUnit === 'kg') {
            return ['kg', 'gramos'];
        }

        return ['botellas'];
    };

    // Convert display quantity to backend quantity (ml/g)
    const convertToBackendUnit = (displayQty: number, unit: DisplayUnit): number => {
        if (!supply) return displayQty;

        const contentPerUnit = supply.content_per_unit || 1;
        const contentUnit = supply.content_unit || supply.unit;

        switch (unit) {
            case 'botellas':
                return displayQty * contentPerUnit;
            case 'litros':
                return displayQty * 1000; // Convert to ml
            case 'ml':
                return displayQty;
            case 'kg':
                return displayQty * 1000; // Convert to g
            case 'gramos':
                return displayQty;
            default:
                return displayQty;
        }
    };

    // Convert backend quantity (ml/g) to display quantity
    const convertToDisplayUnit = (backendQty: number, unit: DisplayUnit): number => {
        if (!supply) return backendQty;

        const contentPerUnit = supply.content_per_unit || 1;
        const contentUnit = supply.content_unit || supply.unit;

        switch (unit) {
            case 'botellas':
                return backendQty / contentPerUnit;
            case 'litros':
                return backendQty / 1000; // Convert from ml
            case 'ml':
                return backendQty;
            case 'kg':
                return backendQty / 1000; // Convert from g
            case 'gramos':
                return backendQty;
            default:
                return backendQty;
        }
    };

    useEffect(() => {
        if (supply && open) {
            // Determine default display unit based on category first
            const category = supply.category?.toLowerCase() || '';
            const contentUnit = supply.content_unit?.toLowerCase() || supply.unit?.toLowerCase() || '';
            let defaultUnit: DisplayUnit = 'botellas';

            // Check category first for more accurate unit determination
            if (category.includes('fruta') || category.includes('fruit')) {
                // Frutas: default to kg
                defaultUnit = 'kg';
            } else if (category.includes('especia') || category.includes('spice')) {
                // Especias: default to gramos
                defaultUnit = 'gramos';
            } else if (category.includes('refresco') || category.includes('no alcohólica') || category.includes('agua')) {
                // Refrescos y agua: default to litros if >= 1L, otherwise botellas
                if (contentUnit === 'l' || (supply.content_per_unit && supply.content_per_unit >= 1000)) {
                    defaultUnit = 'litros';
                } else {
                    defaultUnit = 'botellas';
                }
            } else if (category.includes('licor') || category.includes('alcohol') || (category.includes('bebida') && contentUnit.includes('ml'))) {
                // Licores: default to botellas
                defaultUnit = 'botellas';
            } else if (contentUnit === 'ml' || contentUnit === 'l') {
                // Default for liquids: botellas
                defaultUnit = 'botellas';
            } else if (contentUnit === 'g') {
                // Weight in grams: default to kg
                defaultUnit = 'kg';
            } else if (contentUnit === 'kg') {
                defaultUnit = 'kg';
            }

            setDisplayUnit(defaultUnit);

            // Calculate suggested quantity (difference between optimal and current)
            const suggestedBackend = supply.optimal_quantity
                ? Math.max(0, supply.optimal_quantity - supply.current_quantity)
                : Math.max(0, supply.min_threshold - supply.current_quantity);

            const suggestedDisplay = convertToDisplayUnit(suggestedBackend, defaultUnit);
            setQuantity(Math.round(suggestedDisplay * 10) / 10); // Round to 1 decimal
        }
    }, [supply, open]);

    const handleAddToCart = () => {
        if (!supply || quantity <= 0) {
            toast.error("La cantidad debe ser mayor a 0");
            return;
        }

        // Convert display quantity to backend quantity
        const backendQuantity = convertToBackendUnit(quantity, displayUnit);

        const purchaseItem: PurchaseItem = {
            supplyId: supply.id,
            supplyName: supply.name,
            unit: supply.unit,
            quantityToOrder: backendQuantity,
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

    // Get display values for current and optimal quantities
    const currentDisplay = convertToDisplayUnit(supply.current_quantity, displayUnit);
    const optimalDisplay = convertToDisplayUnit(
        supply.optimal_quantity || supply.min_threshold,
        displayUnit
    );
    const suggestedDisplay = convertToDisplayUnit(suggestedQuantity, displayUnit);

    const availableUnits = getAvailableUnits();

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
                                <p className="font-bold text-lg">
                                    {Math.round(currentDisplay * 10) / 10} {displayUnit}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Cantidad óptima</p>
                                <p className="font-bold text-lg">
                                    {Math.round(optimalDisplay * 10) / 10} {displayUnit}
                                </p>
                            </div>
                        </div>

                        {suggestedQuantity > 0 && (
                            <div className="mt-3 p-2 bg-primary/10 rounded-md">
                                <p className="text-xs text-primary font-medium">
                                    💡 Sugerencia: Pedir {Math.round(suggestedDisplay * 10) / 10} {displayUnit} para alcanzar el nivel óptimo
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quantity Input with Unit Selector */}
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
                                className="text-lg font-semibold flex-1"
                            />
                            <Select value={displayUnit} onValueChange={(value) => setDisplayUnit(value as DisplayUnit)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableUnits.map((unit) => (
                                        <SelectItem key={unit} value={unit}>
                                            {unit.charAt(0).toUpperCase() + unit.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
