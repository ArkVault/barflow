'use client';

import { useEffect, Fragment, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { usePOS } from './pos-context';

// Single Responsibility: Only handles sales history display
export function HistoryTab() {
     const { t, language } = useLanguage();
     const { sales, loadingSales, refreshSales } = usePOS();
     const [expandedSale, setExpandedSale] = useState<string | null>(null);

     useEffect(() => {
          refreshSales();
     }, [refreshSales]);

     const translateTableName = (name: string | null) => {
          if (!name) return '-';
          if (language === 'es') return name;

          if (name.startsWith('Mesa ')) {
               return 'Table ' + name.substring(5);
          }
          if (name.startsWith('Barra ')) {
               return 'Bar ' + name.substring(6);
          }
          if (name.includes(' - Asiento ')) {
               const parts = name.split(' - Asiento ');
               const barPart = parts[0].startsWith('Barra ') ? 'Bar ' + parts[0].substring(6) : parts[0];
               return `${barPart} - Seat ${parts[1]}`;
          }
          return name;
     };

     // Calculate today's stats
     const todaySales = sales.filter(s => {
          const saleDate = new Date(s.created_at);
          const today = new Date();
          return saleDate.toDateString() === today.toDateString();
     });

     const todayTotal = todaySales.reduce((sum, s) => sum + parseFloat(s.total.toString()), 0);
     const todayTransactions = todaySales.length;
     const averageTicket = todayTransactions > 0 ? todayTotal / todayTransactions : 0;

     if (loadingSales) {
          return (
               <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">
                         {language === 'es' ? 'Cargando ventas...' : 'Loading sales...'}
                    </span>
               </div>
          );
     }

     return (
          <div className="space-y-4">
               {/* Stats Cards - Compact */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="neumorphic border-0 p-4">
                         <div className="text-xs text-muted-foreground mb-1">
                              {language === 'es' ? 'Ventas Hoy' : 'Sales Today'}
                         </div>
                         <div className="text-2xl font-bold text-green-600">
                              ${todayTotal.toFixed(2)}
                         </div>
                    </Card>
                    <Card className="neumorphic border-0 p-4">
                         <div className="text-xs text-muted-foreground mb-1">
                              {language === 'es' ? 'Transacciones Hoy' : 'Transactions Today'}
                         </div>
                         <div className="text-2xl font-bold">
                              {todayTransactions}
                         </div>
                    </Card>
                    <Card className="neumorphic border-0 p-4">
                         <div className="text-xs text-muted-foreground mb-1">
                              {language === 'es' ? 'Ticket Promedio' : 'Average Ticket'}
                         </div>
                         <div className="text-2xl font-bold">
                              ${averageTicket.toFixed(2)}
                         </div>
                    </Card>
               </div>

               {/* Sales Table */}
               <Card className="neumorphic border-0">
                    <div className="p-6">
                         <h3 className="text-xl font-bold mb-4">
                              {language === 'es' ? 'Ventas Recientes' : 'Recent Sales'}
                         </h3>
                         <Table>
                              <TableHeader>
                                   <TableRow>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead>{language === 'es' ? 'Ticket' : 'Ticket'}</TableHead>
                                        <TableHead>{language === 'es' ? 'Mesa/Barra' : 'Table/Bar'}</TableHead>
                                        <TableHead>{language === 'es' ? 'Fecha' : 'Date'}</TableHead>
                                        <TableHead>{language === 'es' ? 'Hora' : 'Time'}</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {sales.length === 0 ? (
                                        <TableRow>
                                             <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                                  {language === 'es' ? 'No hay ventas registradas' : 'No sales recorded'}
                                             </TableCell>
                                        </TableRow>
                                   ) : (
                                        sales.map((sale) => (
                                             <Fragment key={sale.id}>
                                                  <TableRow
                                                       className="cursor-pointer hover:bg-accent/50"
                                                       onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                                                  >
                                                       <TableCell>
                                                            {expandedSale === sale.id ? (
                                                                 <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                 <ChevronDown className="h-4 w-4" />
                                                            )}
                                                       </TableCell>
                                                       <TableCell className="font-medium">{sale.order_number}</TableCell>
                                                       <TableCell>{translateTableName(sale.table_name)}</TableCell>
                                                       <TableCell>
                                                            {new Date(sale.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                                                                 day: '2-digit',
                                                                 month: '2-digit',
                                                                 year: 'numeric'
                                                            })}
                                                       </TableCell>
                                                       <TableCell>
                                                            {new Date(sale.created_at).toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', {
                                                                 hour: '2-digit',
                                                                 minute: '2-digit'
                                                            })}
                                                       </TableCell>
                                                       <TableCell>
                                                            <Badge variant="secondary">{sale.items.length} items</Badge>
                                                       </TableCell>
                                                       <TableCell className="text-right font-bold text-green-600">
                                                            ${sale.total.toFixed(2)}
                                                       </TableCell>
                                                  </TableRow>
                                                  {expandedSale === sale.id && (
                                                       <TableRow>
                                                            <TableCell colSpan={7} className="bg-muted/30">
                                                                 <div className="py-4 px-6">
                                                                      <h4 className="font-semibold mb-3 text-sm">
                                                                           {language === 'es' ? 'Detalles del Ticket:' : 'Ticket Details:'}
                                                                      </h4>
                                                                      <div className="space-y-2">
                                                                           {sale.items.map((item, idx) => (
                                                                                <div key={idx} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                                                                     <div className="flex-1">
                                                                                          <span className="font-medium">{item.productName}</span>
                                                                                          <span className="text-muted-foreground text-sm ml-2">
                                                                                               x{item.quantity}
                                                                                          </span>
                                                                                     </div>
                                                                                     <div className="text-right">
                                                                                          <div className="text-sm text-muted-foreground">
                                                                                               ${item.unitPrice.toFixed(2)} c/u
                                                                                          </div>
                                                                                          <div className="font-semibold">
                                                                                               ${item.total.toFixed(2)}
                                                                                          </div>
                                                                                     </div>
                                                                                </div>
                                                                           ))}
                                                                      </div>
                                                                      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                                                                           <span className="font-semibold">Total:</span>
                                                                           <span className="text-lg font-bold text-green-600">
                                                                                ${sale.total.toFixed(2)}
                                                                           </span>
                                                                      </div>
                                                                 </div>
                                                            </TableCell>
                                                       </TableRow>
                                                  )}
                                             </Fragment>
                                        ))
                                   )}
                              </TableBody>
                         </Table>
                    </div>
               </Card>
          </div>
     );
}
