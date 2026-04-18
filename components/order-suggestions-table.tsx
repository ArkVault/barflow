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

interface Supply {
     id: string;
     name: string;
     current_quantity: number;
     unit: string;
     min_threshold: number;
     optimal_quantity?: number;
}

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

// ─── Calculate real consumption from sales data ───
const LOOKBACK_DAYS = 30; // Use last 30 days of sales for consumption rates

export function OrderSuggestionsTable({ period }: OrderSuggestionsTableProps) {
     const { language } = useLanguage();
     const { establishmentId } = useAuth();
     const [suggestions, setSuggestions] = useState<OrderSuggestion[]>([]);
     const [loading, setLoading] = useState(true);
     const es = language === 'es';

     useEffect(() => {
          if (establishmentId) {
               loadSuggestionsFromRealData();
          }
     }, [establishmentId, period]);

     const loadSuggestionsFromRealData = async () => {
          try {
               setLoading(true);
               const supabase = createClient();

               // Fetch supplies
               const { data: supplies, error: supplyError } = await supabase
                    .from('supplies')
                    .select('id, name, current_quantity, unit, min_threshold, optimal_quantity')
                    .eq('establishment_id', establishmentId)
                    .order('current_quantity', { ascending: true });

               if (supplyError || !supplies || supplies.length === 0) {
                    setSuggestions([]);
                    return;
               }

               // Fetch recent sales with product ingredients for real consumption
               const cutoffDate = new Date();
               cutoffDate.setDate(cutoffDate.getDate() - LOOKBACK_DAYS);

               const { data: salesData, error: salesError } = await supabase
                    .from('sales')
                    .select(`
                         id, quantity, sale_date,
                         products (
                              product_ingredients (
                                   supply_id,
                                   quantity_needed
                              )
                         )
                    `)
                    .eq('establishment_id', establishmentId)
                    .gte('sale_date', cutoffDate.toISOString())
                    .order('sale_date', { ascending: false });

               // Build a consumption map: supply_id → total consumed in lookback period
               const consumptionMap = new Map<string, number>();

               if (!salesError && salesData) {
                    for (const sale of salesData) {
                         const ingredients = (sale as any).products?.product_ingredients;
                         if (!Array.isArray(ingredients)) continue;

                         for (const ing of ingredients) {
                              if (!ing.supply_id || !ing.quantity_needed) continue;
                              const prev = consumptionMap.get(ing.supply_id) || 0;
                              consumptionMap.set(ing.supply_id, prev + ing.quantity_needed * (sale.quantity || 1));
                         }
                    }
               }

               // Calculate date range of actual sales data
               const saleDates = (salesData || []).map(s => new Date(s.sale_date).getTime());
               const actualDays = saleDates.length > 0
                    ? Math.max(1, (Date.now() - Math.min(...saleDates)) / (1000 * 60 * 60 * 24))
                    : LOOKBACK_DAYS;

               const daysInPeriod = period === 'week' ? 7 : 30;

               // Generate suggestions
               const orderSuggestions: OrderSuggestion[] = [];

               for (const supply of supplies) {
                    const totalConsumed = consumptionMap.get(supply.id) || 0;
                    const dailyUsage = totalConsumed / actualDays;
                    const periodUsage = dailyUsage * daysInPeriod;

                    const optimal = supply.optimal_quantity && supply.optimal_quantity > 0
                         ? supply.optimal_quantity
                         : supply.min_threshold * 3;

                    // Days until stock falls below min_threshold
                    const daysUntilCritical = dailyUsage > 0
                         ? Math.floor((supply.current_quantity - supply.min_threshold) / dailyUsage)
                         : 999;

                    // Determine if this supply needs reordering
                    const status = calculateStockStatus(supply);
                    const projectedStockAtEndOfPeriod = supply.current_quantity - periodUsage;
                    const needsReorder = status === 'critical' || status === 'low'
                         || projectedStockAtEndOfPeriod < supply.min_threshold
                         || supply.current_quantity < optimal * 0.5;

                    if (!needsReorder) continue;

                    // Suggest enough to reach optimal level + cover the period's consumption
                    const suggestedOrder = Math.max(0, Math.ceil(
                         optimal - supply.current_quantity + periodUsage
                    ));

                    if (suggestedOrder <= 0) continue;

                    let priority: 'high' | 'medium' | 'low';
                    if (status === 'critical' || daysUntilCritical <= 2) {
                         priority = 'high';
                    } else if (status === 'low' || daysUntilCritical <= 5) {
                         priority = 'medium';
                    } else {
                         priority = 'low';
                    }

                    orderSuggestions.push({
                         supplyId: supply.id,
                         supply: supply.name,
                         unit: supply.unit,
                         currentStock: supply.current_quantity,
                         optimalStock: optimal,
                         suggestedOrder,
                         priority,
                         daysUntilCritical: Math.max(0, daysUntilCritical),
                    });
               }

               // Sort by priority then urgency
               orderSuggestions.sort((a, b) => {
                    const order = { high: 0, medium: 1, low: 2 };
                    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
                    return a.daysUntilCritical - b.daysUntilCritical;
               });

               setSuggestions(orderSuggestions.slice(0, 15));
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
               case 'high': return es ? 'Alta' : 'High';
               case 'medium': return es ? 'Media' : 'Medium';
               case 'low': return es ? 'Baja' : 'Low';
               default: return 'Normal';
          }
     };

     return (
          <Card className="neumorphic border-0">
               <CardHeader>
                    <div className="flex items-center justify-between">
                         <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                   <ShoppingCart className="w-5 h-5" />
                                   {es ? 'Pedidos Sugeridos' : 'Suggested Orders'}
                              </CardTitle>
                              <CardDescription>
                                   {es
                                        ? 'Basado en consumo real de los últimos 30 días'
                                        : 'Based on real consumption from the last 30 days'}
                              </CardDescription>
                         </div>
                         {suggestions.length > 0 && (
                              <Button className="neumorphic-hover border-0" size="sm">
                                   {es ? 'Generar Orden de Compra' : 'Generate Purchase Order'}
                              </Button>
                         )}
                    </div>
               </CardHeader>
               <CardContent>
                    {loading ? (
                         <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                              <span className="ml-2 text-sm text-muted-foreground">
                                   {es ? 'Analizando inventario...' : 'Analyzing inventory...'}
                              </span>
                         </div>
                    ) : suggestions.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-8 text-center">
                              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                                   <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
                              </div>
                              <p className="text-sm font-medium text-foreground">
                                   {es ? '¡Inventario en buen estado!' : 'Inventory in good shape!'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                   {es ? 'No hay pedidos urgentes en este momento' : 'No urgent orders needed at this time'}
                              </p>
                         </div>
                    ) : (
                         <Table>
                              <TableHeader>
                                   <TableRow>
                                        <TableHead>{es ? 'Insumo' : 'Supply'}</TableHead>
                                        <TableHead className="text-center">{es ? 'Stock Actual' : 'Current Stock'}</TableHead>
                                        <TableHead className="text-center">{es ? 'Stock Óptimo' : 'Optimal Stock'}</TableHead>
                                        <TableHead className="text-center">{es ? 'Cantidad Sugerida' : 'Suggested Qty'}</TableHead>
                                        <TableHead className="text-center">{es ? 'Prioridad' : 'Priority'}</TableHead>
                                        <TableHead className="text-center">{es ? 'Días Críticos' : 'Critical Days'}</TableHead>
                                        <TableHead className="text-right">{es ? 'Acción' : 'Action'}</TableHead>
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {suggestions.map((suggestion) => (
                                        <TableRow key={suggestion.supplyId}>
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
                                                            {es ? 'Abastecer' : 'Restock'}
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
                                   {es
                                        ? '💡 Sugerencias calculadas a partir del consumo real de ventas de los últimos 30 días, no estimaciones genéricas.'
                                        : '💡 Suggestions calculated from actual sales consumption over the last 30 days, not generic estimates.'}
                              </p>
                         </div>
                    )}
               </CardContent>
          </Card>
     );
}
