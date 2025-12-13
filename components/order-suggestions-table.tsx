"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface OrderSuggestion {
     supply: string;
     currentStock: number;
     projectedNeed: number;
     suggestedOrder: number;
     priority: 'high' | 'medium' | 'low';
     daysUntilCritical: number;
}

interface OrderSuggestionsTableProps {
     period: 'week' | 'month';
}

export function OrderSuggestionsTable({ period }: OrderSuggestionsTableProps) {
     const { language } = useLanguage();

     // Mock data - esto se reemplazará con datos reales basados en proyecciones
     const suggestions: OrderSuggestion[] = period === 'week' ? [
          {
               supply: 'Ron Blanco',
               currentStock: 12,
               projectedNeed: 18,
               suggestedOrder: 20,
               priority: 'high',
               daysUntilCritical: 3
          },
          {
               supply: 'Vodka Premium',
               currentStock: 8,
               projectedNeed: 15,
               suggestedOrder: 18,
               priority: 'high',
               daysUntilCritical: 2
          },
          {
               supply: 'Jugo de Limón',
               currentStock: 25,
               projectedNeed: 30,
               suggestedOrder: 12,
               priority: 'medium',
               daysUntilCritical: 5
          },
          {
               supply: 'Azúcar',
               currentStock: 5,
               projectedNeed: 20,
               suggestedOrder: 25,
               priority: 'high',
               daysUntilCritical: 1
          },
     ] : [
          {
               supply: 'Ron Blanco',
               currentStock: 12,
               projectedNeed: 70,
               suggestedOrder: 80,
               priority: 'high',
               daysUntilCritical: 5
          },
          {
               supply: 'Vodka Premium',
               currentStock: 8,
               projectedNeed: 90,
               suggestedOrder: 100,
               priority: 'high',
               daysUntilCritical: 3
          },
          {
               supply: 'Jugo de Limón',
               currentStock: 25,
               projectedNeed: 112,
               suggestedOrder: 120,
               priority: 'high',
               daysUntilCritical: 7
          },
          {
               supply: 'Azúcar',
               currentStock: 5,
               projectedNeed: 78,
               suggestedOrder: 85,
               priority: 'high',
               daysUntilCritical: 2
          },
     ];

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
                              <CardDescription>{language === 'es' ? 'Basado en proyecciones de demanda' : 'Based on demand projections'}</CardDescription>
                         </div>
                         <Button className="neumorphic-hover border-0" size="sm">
                              {language === 'es' ? 'Generar Orden de Compra' : 'Generate Purchase Order'}
                         </Button>
                    </div>
               </CardHeader>
               <CardContent>
                    <Table>
                         <TableHeader>
                              <TableRow>
                                   <TableHead>{language === 'es' ? 'Insumo' : 'Supply'}</TableHead>
                                   <TableHead className="text-center">{language === 'es' ? 'Stock Actual' : 'Current Stock'}</TableHead>
                                   <TableHead className="text-center">{language === 'es' ? 'Necesidad Proyectada' : 'Projected Need'}</TableHead>
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
                                        <TableCell className="text-center">{suggestion.currentStock}</TableCell>
                                        <TableCell className="text-center font-semibold text-primary">
                                             {suggestion.projectedNeed}
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
                                             <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="neumorphic border-0 bg-background/50 hover:bg-background/80 focus:outline-none focus:ring-0 focus-visible:ring-0"
                                             >
                                                  {language === 'es' ? 'Agregar' : 'Add'}
                                             </Button>
                                        </TableCell>
                                   </TableRow>
                              ))}
                         </TableBody>
                    </Table>
               </CardContent>
          </Card>
     );
}
