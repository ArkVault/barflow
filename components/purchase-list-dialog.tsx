"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, CheckCircle, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import type { PurchaseItem } from "./restock-supply-dialog";

interface PurchaseListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: PurchaseItem[];
    onRemoveItem: (supplyId: string) => void;
    onMarkAsOrdered: (supplyId: string) => void;
    onConfirmReceived: (supplyId: string, quantity: number) => void;
}

export function PurchaseListDialog({
    open,
    onOpenChange,
    items,
    onRemoveItem,
    onMarkAsOrdered,
    onConfirmReceived
}: PurchaseListDialogProps) {

    const pendingItems = items.filter(item => item.status === 'pending');
    const orderedItems = items.filter(item => item.status === 'ordered');

    const handleOrderAll = () => {
        if (pendingItems.length === 0) {
            toast.error("No hay items pendientes para pedir");
            return;
        }

        pendingItems.forEach(item => {
            onMarkAsOrdered(item.supplyId);
        });

        toast.success(`${pendingItems.length} item(s) marcado(s) como pedido`);
    };

    const getStatusBadge = (status: PurchaseItem['status']) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendiente
                </Badge>;
            case 'ordered':
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    <Package className="h-3 w-3 mr-1" />
                    Pedido
                </Badge>;
            case 'received':
                return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Recibido
                </Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] neumorphic border-0">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                        Insumos a Comprar
                    </DialogTitle>
                    <DialogDescription>
                        Gestiona tus pedidos de insumos
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-2">
                    {items.length === 0 ? (
                        <div className="text-center py-12 neumorphic-inset rounded-lg">
                            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No hay insumos en la lista de compras</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Usa el botón "Abastecer" en la tabla de insumos para agregar items
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Pending Items */}
                            {pendingItems.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                                        Pendientes ({pendingItems.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {pendingItems.map((item) => (
                                            <div
                                                key={item.supplyId}
                                                className="neumorphic-inset p-4 rounded-lg flex items-center justify-between"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-semibold">{item.supplyName}</h4>
                                                        {getStatusBadge(item.status)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Cantidad: <span className="font-bold text-foreground">{item.quantityToOrder} {item.unit}</span>
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onRemoveItem(item.supplyId)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ordered Items */}
                            {orderedItems.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                                        Pedidos ({orderedItems.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {orderedItems.map((item) => (
                                            <div
                                                key={item.supplyId}
                                                className="neumorphic-inset p-4 rounded-lg flex items-center justify-between"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-semibold">{item.supplyName}</h4>
                                                        {getStatusBadge(item.status)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Cantidad: <span className="font-bold text-foreground">{item.quantityToOrder} {item.unit}</span>
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onConfirmReceived(item.supplyId, item.quantityToOrder)}
                                                        className="neumorphic-hover"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Confirmar recepción
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onRemoveItem(item.supplyId)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                {items.length > 0 && (
                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            onClick={handleOrderAll}
                            disabled={pendingItems.length === 0}
                            className="flex-1 neumorphic-hover"
                            variant="default"
                        >
                            <Package className="h-4 w-4 mr-2" />
                            Pedir ({pendingItems.length})
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
