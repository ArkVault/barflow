"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, AlertTriangle } from "lucide-react";

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
               case 'high': return 'Alta';
               case 'medium': return 'Media';
               case 'low': return 'Baja';
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
                                   Pedidos Sugeridos
                              </CardTitle>
                              <CardDescription>Basado en proyecciones de demanda</CardDescription>
                         </div>
                         <Button className="neumorphic-hover border-0" size="sm">
                              Generar Orden de Compra
                         </Button>
                    </div>
               </CardHeader>
               <CardContent>
                    <Table>
                         <TableHeader>
                              <TableRow>
                                   <TableHead>Insumo</TableHead>
                                   <TableHead className="text-center">Stock Actual</TableHead>
                                   <TableHead className="text-center">Necesidad Proyectada</TableHead>
                                   <TableHead className="text-center">Cantidad Sugerida</TableHead>
                                   <TableHead className="text-center">Prioridad</TableHead>
                                   <TableHead className="text-center">Días Críticos</TableHead>
                                   <TableHead className="text-right">Acción</TableHead>
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
                                                  Agregar
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
