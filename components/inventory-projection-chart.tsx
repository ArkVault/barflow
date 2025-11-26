"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface InventoryProjectionProps {
     period: 'week' | 'month';
}

export function InventoryProjectionChart({ period }: InventoryProjectionProps) {
     const [selectedProduct, setSelectedProduct] = useState<string>('all');

     // Mock data - esto se reemplazará con datos reales
     const mockData = period === 'week' ? [
          { day: 'Lun', actual: 45, proyectado: 43, minimo: 30 },
          { day: 'Mar', actual: 42, proyectado: 40, minimo: 30 },
          { day: 'Mié', actual: 38, proyectado: 37, minimo: 30 },
          { day: 'Jue', actual: 35, proyectado: 34, minimo: 30 },
          { day: 'Vie', actual: 31, proyectado: 30, minimo: 30 },
          { day: 'Sáb', actual: null, proyectado: 26, minimo: 30 },
          { day: 'Dom', actual: null, proyectado: 23, minimo: 30 },
     ] : [
          { day: 'Sem 1', actual: 45, proyectado: 42, minimo: 30 },
          { day: 'Sem 2', actual: 38, proyectado: 35, minimo: 30 },
          { day: 'Sem 3', actual: 32, proyectado: 28, minimo: 30 },
          { day: 'Sem 4', actual: null, proyectado: 22, minimo: 30 },
     ];

     const products = [
          { value: 'all', label: 'Todos los productos' },
          { value: 'ron', label: 'Ron Blanco' },
          { value: 'vodka', label: 'Vodka Premium' },
          { value: 'limon', label: 'Jugo de Limón' },
     ];

     return (
          <Card className="neumorphic border-0">
               <CardHeader>
                    <div className="flex items-center justify-between">
                         <div>
                              <CardTitle className="text-lg">Proyección de Inventario</CardTitle>
                              <CardDescription>Estimación basada en consumo histórico</CardDescription>
                         </div>
                         <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                              <SelectTrigger className="w-[200px]">
                                   <SelectValue placeholder="Seleccionar producto" />
                              </SelectTrigger>
                              <SelectContent>
                                   {products.map(product => (
                                        <SelectItem key={product.value} value={product.value}>
                                             {product.label}
                                        </SelectItem>
                                   ))}
                              </SelectContent>
                         </Select>
                    </div>
               </CardHeader>
               <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                         <LineChart data={mockData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                              <XAxis
                                   dataKey="day"
                                   stroke="rgba(255,255,255,0.5)"
                                   style={{ fontSize: '12px' }}
                              />
                              <YAxis
                                   stroke="rgba(255,255,255,0.5)"
                                   style={{ fontSize: '12px' }}
                              />
                              <Tooltip
                                   contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '8px'
                                   }}
                              />
                              <Legend />
                              <Line
                                   type="monotone"
                                   dataKey="actual"
                                   stroke="#4A90E2"
                                   strokeWidth={2}
                                   name="Inventario Actual"
                                   dot={{ fill: '#4A90E2', r: 4 }}
                              />
                              <Line
                                   type="monotone"
                                   dataKey="proyectado"
                                   stroke="#87CEEB"
                                   strokeWidth={2}
                                   strokeDasharray="5 5"
                                   name="Proyección"
                                   dot={{ fill: '#87CEEB', r: 4 }}
                              />
                              <Line
                                   type="monotone"
                                   dataKey="minimo"
                                   stroke="#ef4444"
                                   strokeWidth={1}
                                   strokeDasharray="3 3"
                                   name="Nivel Mínimo"
                                   dot={false}
                              />
                         </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                         <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#4A90E2]"></div>
                              <span className="text-muted-foreground">Inventario Actual</span>
                         </div>
                         <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#87CEEB]"></div>
                              <span className="text-muted-foreground">Proyección</span>
                         </div>
                         <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-muted-foreground">Nivel Crítico</span>
                         </div>
                    </div>
               </CardContent>
          </Card>
     );
}
