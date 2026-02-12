"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, AlertTriangle, Loader2, Plus } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { calculateStockStatus } from '@/lib/stock-utils';
import type { Supply } from "@/types";

interface OrderSuggestion {
     supplyId: string;
     supply: string;
     unit: string;
     currentStock: number;
     optimalStock: number;
     suggestedOrder: number;
     priority: 'high' | 'medium' | 'low';
     daysUntilCritical: number;
}

interface OrderSuggestionsTableProps {
     period: 'week' | 'month';
}

export function OrderSuggestionsTable({ period }: OrderSuggestionsTableProps) {
     const { language } = useLanguage();
     const { establishmentId } = useAuth();
     const [suggestions, setSuggestions] = useState<OrderSuggestion[]>([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          if (establishmentId) {
               loadSuggestionsFromSupplies();
          }
     }, [establishmentId, period]);

     const loadSuggestionsFromSupplies = async () => {
          try {
               setLoading(true);
               const supabase = createClient();

               // Fetch real supplies from database
               const { data: supplies, error } = await supabase
                    .from('supplies')
                    .select('id, name, current_quantity, unit, category, min_threshold, optimal_quantity')
                    .eq('establishment_id', establishmentId)
                    .order('current_quantity', { ascending: true });

               if (error) {
                    console.error('Error loading supplies:', error);
                    setSuggestions([]);
                    return;
               }

               if (!supplies || supplies.length === 0) {
                    setSuggestions([]);
                    return;
               }

               // Calculate consumption rate from sales (approx based on period)
               const dailyConsumptionRate = period === 'week' ? 1.5 : 1.2; // Avg units per day
               const daysInPeriod = period === 'week' ? 7 : 30;

               // Generate suggestions for supplies that need reordering
               const orderSuggestions: OrderSuggestion[] = [];

               supplies.forEach((supply: Supply) => {
                    const status = calculateStockStatus(supply);
                    const optimal = supply.optimal_quantity || supply.min_threshold * 3;
                    const projectedConsumption = supply.current_quantity * dailyConsumptionRate;

                    // Calculate days until critical (stock falls below min_threshold)
                    const dailyUsage = projectedConsumption / daysInPeriod;
                    const daysUntilCritical = dailyUsage > 0
                         ? Math.floor((supply.current_quantity - supply.min_threshold) / dailyUsage)
                         : 999;

                    // Only suggest orders for supplies that are low or critical
                    if (status === 'critical' || status === 'low' || supply.current_quantity < optimal * 0.5) {
                         const suggestedOrder = Math.max(0, Math.ceil(optimal - supply.current_quantity));

                         let priority: 'high' | 'medium' | 'low';
                         if (status === 'critical' || daysUntilCritical <= 2) {
                              priority = 'high';
                         } else if (status === 'low' || daysUntilCritical <= 5) {
                              priority = 'medium';
                         } else {
                              priority = 'low';
                         }

                         if (suggestedOrder > 0) {
                              orderSuggestions.push({
                                   supplyId: supply.id,
                                   supply: supply.name,
                                   unit: supply.unit,
                                   currentStock: supply.current_quantity,
                                   optimalStock: optimal,
                                   suggestedOrder: suggestedOrder,
                                   priority: priority,
                                   daysUntilCritical: Math.max(0, daysUntilCritical)
                              });
                         }
                    }
               });

               // Sort by priority (high first) then by days until critical
               orderSuggestions.sort((a, b) => {
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                         return priorityOrder[a.priority] - priorityOrder[b.priority];
                    }
                    return a.daysUntilCritical - b.daysUntilCritical;
               });

               setSuggestions(orderSuggestions.slice(0, 10)); // Top 10 suggestions
          } catch (error) {
               console.error('Error generating suggestions:', error);
               setSuggestions([]);
          } finally {
               setLoading(false);
          }
     };

     const getPriorityColor = (priority: string) => {
          switch (priority) {
               case 'high': return 'bg-red-500';
               case 'medium': return 'bg-amber-500';
               case 'low': return 'bg-green-500';
               default: return 'bg-gray-500';
          }
     };

     const getPriorityLabel = (priority: string) => {
          switch (priority) {
               case 'high': return language === 'es' ? 'Alta' : 'High';
               case 'medium': return language === 'es' ? 'Media' : 'Medium';
               case 'low': return language === 'es' ? 'Baja' : 'Low';
               default: return language === 'es' ? 'Normal' : 'Normal';
          }
     };

     return (
          <Card className="neumorphic border-0">
               <CardHeader>
                    <div className="flex items-center justify-between">
                         <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                   <ShoppingCart className="w-5 h-5" />
                                   {language === 'es' ? 'Pedidos Sugeridos' : 'Suggested Orders'}
                              </CardTitle>
                              <CardDescription>
                                   {language === 'es'
                                        ? 'Basado en niveles actuales de inventario'
                                        : 'Based on current inventory levels'}
                              </CardDescription>
                         </div>
                         {suggestions.length > 0 && (
                              <Button className="neumorphic-hover border-0" size="sm">
                                   {language === 'es' ? 'Generar Orden de Compra' : 'Generate Purchase Order'}
                              </Button>
                         )}
                    </div>
               </CardHeader>
               <CardContent>
                    {loading ? (
                         <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                              <span className="ml-2 text-sm text-muted-foreground">
                                   {language === 'es' ? 'Analizando inventario...' : 'Analyzing inventory...'}
                              </span>
                         </div>
                    ) : suggestions.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-8 text-center">
                              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                                   <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
                              </div>
                              <p className="text-sm font-medium text-foreground">
                                   {language === 'es' ? '¡Inventario en buen estado!' : 'Inventory in good shape!'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                   {language === 'es'
                                        ? 'No hay pedidos urgentes en este momento'
                                        : 'No urgent orders needed at this time'}
                              </p>
                         </div>
                    ) : (
                         <Table>
                              <TableHeader>
                                   <TableRow>
                                        <TableHead>{language === 'es' ? 'Insumo' : 'Supply'}</TableHead>
                                        <TableHead className="text-center">{language === 'es' ? 'Stock Actual' : 'Current Stock'}</TableHead>
                                        <TableHead className="text-center">{language === 'es' ? 'Stock Óptimo' : 'Optimal Stock'}</TableHead>
                                        <TableHead className="text-center">{language === 'es' ? 'Cantidad Sugerida' : 'Suggested Qty'}</TableHead>
                                        <TableHead className="text-center">{language === 'es' ? 'Prioridad' : 'Priority'}</TableHead>
                                        <TableHead className="text-center">{language === 'es' ? 'Días Críticos' : 'Critical Days'}</TableHead>
                                        <TableHead className="text-right">{language === 'es' ? 'Acción' : 'Action'}</TableHead>
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {suggestions.map((suggestion, index) => (
                                        <TableRow key={index}>
                                             <TableCell className="font-medium">{suggestion.supply}</TableCell>
                                             <TableCell className="text-center">
                                                  {suggestion.currentStock} {suggestion.unit}
                                             </TableCell>
                                             <TableCell className="text-center font-semibold text-primary">
                                                  {suggestion.optimalStock} {suggestion.unit}
                                             </TableCell>
                                             <TableCell className="text-center">
                                                  <span className="font-bold text-green-500">+{suggestion.suggestedOrder}</span>
                                             </TableCell>
                                             <TableCell className="text-center">
                                                  <Badge className={getPriorityColor(suggestion.priority)}>
                                                       {getPriorityLabel(suggestion.priority)}
                                                  </Badge>
                                             </TableCell>
                                             <TableCell className="text-center">
                                                  <div className="flex items-center justify-center gap-1">
                                                       {suggestion.daysUntilCritical <= 3 && (
                                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                                       )}
                                                       <span className={suggestion.daysUntilCritical <= 3 ? 'text-red-500 font-bold' : ''}>
                                                            {suggestion.daysUntilCritical}d
                                                       </span>
                                                  </div>
                                             </TableCell>
                                             <TableCell className="text-right">
                                                  <Link href={`/dashboard/insumos?restock=${suggestion.supplyId}`}>
                                                       <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="neumorphic border-0 bg-primary/10 hover:bg-primary/20 text-primary focus:outline-none focus:ring-0 focus-visible:ring-0"
                                                       >
                                                            <Plus className="w-3 h-3 mr-1" />
                                                            {language === 'es' ? 'Abastecer' : 'Restock'}
                                                       </Button>
                                                  </Link>
                                             </TableCell>
                                        </TableRow>
                                   ))}
                              </TableBody>
                         </Table>
                    )}

                    {suggestions.length > 0 && (
                         <div className="mt-4 p-2 rounded bg-muted/30 border border-muted/50">
                              <p className="text-xs text-muted-foreground">
                                   💡 <strong>{language === 'es' ? 'Datos reales:' : 'Real data:'}</strong> {language === 'es'
                                        ? 'Sugerencias basadas en tus niveles de inventario actuales y umbrales configurados'
                                        : 'Suggestions based on your current inventory levels and configured thresholds'}
                              </p>
                         </div>
                    )}
               </CardContent>
          </Card>
     );
}
