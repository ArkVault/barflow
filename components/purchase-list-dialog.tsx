"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, CheckCircle, Trash2, Clock, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/hooks/use-language";
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
    const { establishmentName } = useAuth();
    const { language } = useLanguage();

    const pendingItems = items.filter(item => item.status === 'pending');
    const orderedItems = items.filter(item => item.status === 'ordered');

    const handleOrderAll = () => {
        if (pendingItems.length === 0) {
            toast.error(language === 'es' ? "No hay items pendientes para pedir" : "No pending items to order");
            return;
        }

        pendingItems.forEach(item => {
            onMarkAsOrdered(item.supplyId);
        });

        toast.success(language === 'es'
            ? `${pendingItems.length} item(s) marcado(s) como pedido`
            : `${pendingItems.length} item(s) marked as ordered`);
    };

    const handleDownloadPDF = async () => {
        try {
            // Dynamic import of jsPDF to avoid SSR issues
            const { jsPDF } = await import('jspdf');

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 20;

            // Title
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('BARMODE', pageWidth / 2, y, { align: 'center' });
            y += 10;

            // Subtitle
            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.text(language === 'es' ? 'Orden de Compra' : 'Purchase Order', pageWidth / 2, y, { align: 'center' });
            y += 15;

            // Establishment name
            if (establishmentName) {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(establishmentName, pageWidth / 2, y, { align: 'center' });
                y += 10;
            }

            // Date and time
            const now = new Date();
            const dateStr = now.toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const timeStr = now.toLocaleTimeString(language === 'es' ? 'es-MX' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`${language === 'es' ? 'Fecha' : 'Date'}: ${dateStr}`, 20, y);
            doc.text(`${language === 'es' ? 'Hora' : 'Time'}: ${timeStr}`, pageWidth - 20, y, { align: 'right' });
            y += 15;

            // Separator line
            doc.setDrawColor(200, 200, 200);
            doc.line(20, y, pageWidth - 20, y);
            y += 10;

            // Table headers
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('#', 25, y);
            doc.text(language === 'es' ? 'Insumo' : 'Supply', 35, y);
            doc.text(language === 'es' ? 'Cantidad' : 'Quantity', pageWidth - 60, y);
            doc.text(language === 'es' ? 'Unidad' : 'Unit', pageWidth - 25, y);
            y += 3;
            doc.line(20, y, pageWidth - 20, y);
            y += 7;

            // Items
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);

            items.forEach((item, index) => {
                if (y > 260) {
                    doc.addPage();
                    y = 20;
                }

                doc.text((index + 1).toString(), 25, y);
                doc.text(item.supplyName.substring(0, 40), 35, y);
                doc.text(item.quantityToOrder.toString(), pageWidth - 60, y);
                doc.text(item.unit, pageWidth - 25, y);
                y += 8;
            });

            // Separator
            y += 5;
            doc.line(20, y, pageWidth - 20, y);
            y += 10;

            // Total items
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(`Total: ${items.length} ${language === 'es' ? 'items' : 'items'}`, pageWidth - 20, y, { align: 'right' });
            y += 20;

            // Footer instruction box
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(20, y, pageWidth - 40, 35, 3, 3, 'F');
            y += 10;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(80, 80, 80);
            doc.text(language === 'es' ? 'IMPORTANTE:' : 'IMPORTANT:', 25, y);
            y += 6;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const footerText = language === 'es'
                ? 'Una vez recibida la mercancía, confirmar las compras en el software:'
                : 'Once merchandise is received, confirm purchases in the software:';
            doc.text(footerText, 25, y);
            y += 5;

            doc.setFont('helvetica', 'bold');
            doc.text('Flowstock > Insumos > Insumos a Comprar > Confirmar Recepción', 25, y);

            // Save PDF
            const fileName = `orden_compra_${now.toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            toast.success(language === 'es' ? 'PDF descargado exitosamente' : 'PDF downloaded successfully');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error(language === 'es' ? 'Error al generar PDF' : 'Error generating PDF');
        }
    };

    const getStatusBadge = (status: PurchaseItem['status']) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                    <Clock className="h-3 w-3 mr-1" />
                    {language === 'es' ? 'Pendiente' : 'Pending'}
                </Badge>;
            case 'ordered':
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    <Package className="h-3 w-3 mr-1" />
                    {language === 'es' ? 'Pedido' : 'Ordered'}
                </Badge>;
            case 'received':
                return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {language === 'es' ? 'Recibido' : 'Received'}
                </Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] neumorphic border-0">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                        {language === 'es' ? 'Insumos a Comprar' : 'Supplies to Buy'}
                    </DialogTitle>
                    <DialogDescription>
                        {language === 'es' ? 'Gestiona tus pedidos de insumos' : 'Manage your supply orders'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-2">
                    {items.length === 0 ? (
                        <div className="text-center py-12 neumorphic-inset rounded-lg">
                            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">
                                {language === 'es' ? 'No hay insumos en la lista de compras' : 'No supplies in shopping list'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                {language === 'es'
                                    ? 'Usa el botón "Abastecer" en la tabla de insumos para agregar items'
                                    : 'Use the "Restock" button in the supplies table to add items'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Pending Items */}
                            {pendingItems.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                                        {language === 'es' ? 'Pendientes' : 'Pending'} ({pendingItems.length})
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
                                                        {language === 'es' ? 'Cantidad' : 'Quantity'}: <span className="font-bold text-foreground">{item.quantityToOrder} {item.unit}</span>
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
                                        {language === 'es' ? 'Pedidos' : 'Ordered'} ({orderedItems.length})
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
                                                        {language === 'es' ? 'Cantidad' : 'Quantity'}: <span className="font-bold text-foreground">{item.quantityToOrder} {item.unit}</span>
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
                                                        {language === 'es' ? 'Confirmar recepción' : 'Confirm receipt'}
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
                            onClick={handleDownloadPDF}
                            variant="outline"
                            className="flex-1 neumorphic-hover"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {language === 'es' ? 'Descargar PDF' : 'Download PDF'}
                        </Button>
                        <Button
                            onClick={handleOrderAll}
                            disabled={pendingItems.length === 0}
                            className="flex-1 neumorphic-hover"
                            variant="default"
                        >
                            <Package className="h-4 w-4 mr-2" />
                            {language === 'es' ? 'Pedir' : 'Order'} ({pendingItems.length})
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

