'use client';

import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Printer, Download, X } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export interface ReceiptItem {
     productName: string;
     quantity: number;
     unitPrice: number;
     total: number;
}

export interface ReceiptData {
     orderNumber: string;
     tableName: string;
     items: ReceiptItem[];
     subtotal: number;
     tax: number;
     total: number;
     date: Date;
     establishmentName?: string;
}

interface ReceiptGeneratorProps {
     open: boolean;
     onOpenChange: (open: boolean) => void;
     receiptData: ReceiptData | null;
     onConfirm: () => void;
}

export function ReceiptGenerator({ open, onOpenChange, receiptData, onConfirm }: ReceiptGeneratorProps) {
     const { language } = useLanguage();
     const receiptRef = useRef<HTMLDivElement>(null);

     const formatCurrency = (amount: number) => {
          return `$${amount.toFixed(2)}`;
     };

     const formatDate = (date: Date) => {
          return new Intl.DateTimeFormat(language === 'es' ? 'es-MX' : 'en-US', {
               year: 'numeric',
               month: 'short',
               day: 'numeric',
               hour: '2-digit',
               minute: '2-digit',
          }).format(date);
     };

     const handlePrint = useCallback(() => {
          if (!receiptRef.current) return;

          const printWindow = window.open('', '_blank');
          if (!printWindow) {
               alert(language === 'es' ? 'Por favor permite ventanas emergentes para imprimir' : 'Please allow popups to print');
               return;
          }

          const printContent = `
               <!DOCTYPE html>
               <html>
               <head>
                    <title>Ticket - ${receiptData?.orderNumber}</title>
                    <style>
                         @media print {
                              @page {
                                   size: 80mm auto;
                                   margin: 0;
                              }
                         }
                         * {
                              margin: 0;
                              padding: 0;
                              box-sizing: border-box;
                         }
                         body {
                              font-family: 'Courier New', monospace;
                              width: 80mm;
                              padding: 10px;
                              font-size: 12px;
                              line-height: 1.4;
                         }
                         .header {
                              text-align: center;
                              padding-bottom: 10px;
                              border-bottom: 1px dashed #000;
                              margin-bottom: 10px;
                         }
                         .header h1 {
                              font-size: 18px;
                              margin-bottom: 5px;
                         }
                         .header p {
                              font-size: 11px;
                              color: #333;
                         }
                         .info {
                              margin-bottom: 10px;
                              padding-bottom: 10px;
                              border-bottom: 1px dashed #000;
                         }
                         .info-row {
                              display: flex;
                              justify-content: space-between;
                              margin-bottom: 3px;
                         }
                         .items-header {
                              display: flex;
                              justify-content: space-between;
                              font-weight: bold;
                              padding-bottom: 5px;
                              border-bottom: 1px solid #000;
                              margin-bottom: 5px;
                         }
                         .item-row {
                              display: flex;
                              justify-content: space-between;
                              padding: 3px 0;
                         }
                         .item-name {
                              flex: 1;
                              padding-right: 10px;
                         }
                         .item-qty {
                              width: 30px;
                              text-align: center;
                         }
                         .item-price {
                              width: 60px;
                              text-align: right;
                         }
                         .totals {
                              margin-top: 10px;
                              padding-top: 10px;
                              border-top: 1px dashed #000;
                         }
                         .total-row {
                              display: flex;
                              justify-content: space-between;
                              padding: 3px 0;
                         }
                         .grand-total {
                              font-size: 16px;
                              font-weight: bold;
                              margin-top: 5px;
                              padding-top: 5px;
                              border-top: 2px solid #000;
                         }
                         .footer {
                              margin-top: 15px;
                              text-align: center;
                              font-size: 11px;
                              border-top: 1px dashed #000;
                              padding-top: 10px;
                         }
                    </style>
               </head>
               <body>
                    <div class="header">
                         <h1>${receiptData?.establishmentName || 'Flowstock'}</h1>
                         <p>${language === 'es' ? 'Ticket de Venta' : 'Sales Receipt'}</p>
                    </div>
                    
                    <div class="info">
                         <div class="info-row">
                              <span>${language === 'es' ? 'Orden:' : 'Order:'}</span>
                              <span>${receiptData?.orderNumber || '-'}</span>
                         </div>
                         <div class="info-row">
                              <span>${language === 'es' ? 'Mesa:' : 'Table:'}</span>
                              <span>${receiptData?.tableName || '-'}</span>
                         </div>
                         <div class="info-row">
                              <span>${language === 'es' ? 'Fecha:' : 'Date:'}</span>
                              <span>${receiptData ? formatDate(receiptData.date) : '-'}</span>
                         </div>
                    </div>
                    
                    <div class="items-header">
                         <span class="item-name">${language === 'es' ? 'Producto' : 'Item'}</span>
                         <span class="item-qty">${language === 'es' ? 'Cant' : 'Qty'}</span>
                         <span class="item-price">${language === 'es' ? 'Total' : 'Total'}</span>
                    </div>
                    
                    ${receiptData?.items.map(item => `
                         <div class="item-row">
                              <span class="item-name">${item.productName}</span>
                              <span class="item-qty">${item.quantity}</span>
                              <span class="item-price">${formatCurrency(item.total)}</span>
                         </div>
                    `).join('') || ''}
                    
                    <div class="totals">
                         <div class="total-row">
                              <span>Subtotal:</span>
                              <span>${formatCurrency(receiptData?.subtotal || 0)}</span>
                         </div>
                         <div class="total-row">
                              <span>IVA (16%):</span>
                              <span>${formatCurrency(receiptData?.tax || 0)}</span>
                         </div>
                         <div class="total-row grand-total">
                              <span>TOTAL:</span>
                              <span>${formatCurrency(receiptData?.total || 0)}</span>
                         </div>
                    </div>
                    
                    <div class="footer">
                         <p>¡${language === 'es' ? 'Gracias por su visita!' : 'Thank you for your visit!'}</p>
                         <p style="margin-top: 5px; font-size: 10px;">${language === 'es' ? 'Powered by Flowstock' : 'Powered by Flowstock'}</p>
                    </div>
               </body>
               </html>
          `;

          printWindow.document.write(printContent);
          printWindow.document.close();
          printWindow.focus();

          // Wait for content to load then print
          setTimeout(() => {
               printWindow.print();
               printWindow.close();
          }, 250);
     }, [receiptData, language, formatDate]);

     const handleDownload = useCallback(() => {
          if (!receiptData) return;

          const receiptText = `
═══════════════════════════════════════
         ${receiptData.establishmentName || 'BARFLOW'}
         ${language === 'es' ? 'TICKET DE VENTA' : 'SALES RECEIPT'}
═══════════════════════════════════════

${language === 'es' ? 'Orden:' : 'Order:'} ${receiptData.orderNumber}
${language === 'es' ? 'Mesa:' : 'Table:'} ${receiptData.tableName}
${language === 'es' ? 'Fecha:' : 'Date:'} ${formatDate(receiptData.date)}

───────────────────────────────────────
${language === 'es' ? 'PRODUCTOS' : 'ITEMS'}
───────────────────────────────────────
${receiptData.items.map(item =>
               `${item.quantity}x ${item.productName.padEnd(20)} ${formatCurrency(item.total).padStart(10)}`
          ).join('\n')}
───────────────────────────────────────
${'Subtotal:'.padEnd(30)} ${formatCurrency(receiptData.subtotal).padStart(10)}
${'IVA (16%):'.padEnd(30)} ${formatCurrency(receiptData.tax).padStart(10)}
═══════════════════════════════════════
${'TOTAL:'.padEnd(30)} ${formatCurrency(receiptData.total).padStart(10)}
═══════════════════════════════════════

      ${language === 'es' ? '¡Gracias por su visita!' : 'Thank you for your visit!'}
               Powered by Flowstock
          `.trim();

          const blob = new Blob([receiptText], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ticket-${receiptData.orderNumber}.txt`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
     }, [receiptData, language, formatDate]);

     if (!receiptData) return null;

     return (
          <Dialog open={open} onOpenChange={onOpenChange}>
               <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                         <DialogTitle className="flex items-center gap-2">
                              <Printer className="w-5 h-5" />
                              {language === 'es' ? 'Confirmar Mesa Pagada' : 'Confirm Table Paid'}
                         </DialogTitle>
                    </DialogHeader>

                    {/* Receipt Preview */}
                    <div
                         ref={receiptRef}
                         className="bg-white text-black rounded-lg p-4 font-mono text-sm shadow-inner border"
                    >
                         {/* Header */}
                         <div className="text-center pb-3 border-b border-dashed border-gray-400">
                              <h2 className="font-bold text-lg">{receiptData.establishmentName || 'Flowstock'}</h2>
                              <p className="text-xs text-gray-600">
                                   {language === 'es' ? 'Ticket de Venta' : 'Sales Receipt'}
                              </p>
                         </div>

                         {/* Order Info */}
                         <div className="py-3 border-b border-dashed border-gray-400 text-xs">
                              <div className="flex justify-between">
                                   <span>{language === 'es' ? 'Orden:' : 'Order:'}</span>
                                   <span className="font-semibold">{receiptData.orderNumber}</span>
                              </div>
                              <div className="flex justify-between mt-1">
                                   <span>{language === 'es' ? 'Mesa:' : 'Table:'}</span>
                                   <span>{receiptData.tableName}</span>
                              </div>
                              <div className="flex justify-between mt-1">
                                   <span>{language === 'es' ? 'Fecha:' : 'Date:'}</span>
                                   <span>{formatDate(receiptData.date)}</span>
                              </div>
                         </div>

                         {/* Items */}
                         <div className="py-3 border-b border-dashed border-gray-400">
                              <div className="flex justify-between text-xs font-bold mb-2">
                                   <span className="flex-1">{language === 'es' ? 'Producto' : 'Item'}</span>
                                   <span className="w-8 text-center">{language === 'es' ? 'Cant' : 'Qty'}</span>
                                   <span className="w-16 text-right">Total</span>
                              </div>
                              {receiptData.items.map((item, index) => (
                                   <div key={index} className="flex justify-between text-xs py-1">
                                        <span className="flex-1 truncate pr-2">{item.productName}</span>
                                        <span className="w-8 text-center">{item.quantity}</span>
                                        <span className="w-16 text-right">{formatCurrency(item.total)}</span>
                                   </div>
                              ))}
                         </div>

                         {/* Totals */}
                         <div className="pt-3 text-xs">
                              <div className="flex justify-between">
                                   <span>Subtotal:</span>
                                   <span>{formatCurrency(receiptData.subtotal)}</span>
                              </div>
                              <div className="flex justify-between mt-1">
                                   <span>IVA (16%):</span>
                                   <span>{formatCurrency(receiptData.tax)}</span>
                              </div>
                              <div className="flex justify-between mt-2 pt-2 border-t-2 border-black font-bold text-base">
                                   <span>TOTAL:</span>
                                   <span>{formatCurrency(receiptData.total)}</span>
                              </div>
                         </div>

                         {/* Footer */}
                         <div className="mt-4 pt-3 border-t border-dashed border-gray-400 text-center text-xs text-gray-600">
                              <p>{language === 'es' ? '¡Gracias por su visita!' : 'Thank you for your visit!'}</p>
                              <p className="mt-1 text-[10px]">Powered by Flowstock</p>
                         </div>
                    </div>

                    <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                         <div className="flex gap-2 flex-1">
                              <Button
                                   variant="outline"
                                   className="flex-1"
                                   onClick={handleDownload}
                              >
                                   <Download className="w-4 h-4 mr-2" />
                                   {language === 'es' ? 'Descargar' : 'Download'}
                              </Button>
                              <Button
                                   variant="outline"
                                   className="flex-1"
                                   onClick={handlePrint}
                              >
                                   <Printer className="w-4 h-4 mr-2" />
                                   {language === 'es' ? 'Imprimir' : 'Print'}
                              </Button>
                         </div>
                         <div className="flex gap-2 flex-1">
                              <Button
                                   variant="ghost"
                                   className="flex-1"
                                   onClick={() => onOpenChange(false)}
                              >
                                   <X className="w-4 h-4 mr-2" />
                                   {language === 'es' ? 'Cancelar' : 'Cancel'}
                              </Button>
                              <Button
                                   className="flex-1 bg-green-600 hover:bg-green-700"
                                   onClick={() => {
                                        onConfirm();
                                        onOpenChange(false);
                                   }}
                              >
                                   {language === 'es' ? 'Confirmar Pago' : 'Confirm Payment'}
                              </Button>
                         </div>
                    </DialogFooter>
               </DialogContent>
          </Dialog>
     );
}
