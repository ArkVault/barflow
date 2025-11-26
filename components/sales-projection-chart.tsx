"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesProjectionProps {
     period: 'week' | 'month';
}

export function SalesProjectionChart({ period }: SalesProjectionProps) {
     const [selectedProduct, setSelectedProduct] = useState<string>('all');

     // Mock data - esto se reemplazará con datos reales
     const mockData = period === 'week' ? [
          { day: 'Lun', ventas: 45, proyectado: 48 },
          { day: 'Mar', ventas: 52, proyectado: 50 },
          { day: 'Mié', ventas: 48, proyectado: 52 },
          { day: 'Jue', ventas: 61, proyectado: 58 },
          { day: 'Vie', ventas: 75, proyectado: 72 },
          { day: 'Sáb', ventas: null, proyectado: 85 },
          { day: 'Dom', ventas: null, proyectado: 68 },
     ] : [
          { day: 'Sem 1', ventas: 320, proyectado: 310 },
          { day: 'Sem 2', ventas: 345, proyectado: 340 },
          { day: 'Sem 3', ventas: 380, proyectado: 370 },
          { day: 'Sem 4', ventas: null, proyectado: 390 },
     ];

     const products = [
          { value: 'all', label: 'Todos los productos' },
          { value: 'mojito', label: 'Mojito Clásico' },
          { value: 'margarita', label: 'Margarita' },
          { value: 'daiquiri', label: 'Daiquiri' },
     ];

     return (
          <Card className="neumorphic border-0">
               <CardHeader>
                    <div className="flex items-center justify-between">
                         <div>
                              <CardTitle className="text-lg">Proyección de Ventas</CardTitle>
                              <CardDescription>Estimación basada en tendencias históricas</CardDescription>
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
                         <BarChart data={mockData}>
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
                              <Bar
                                   dataKey="ventas"
                                   fill="#22c55e"
                                   name="Ventas Reales"
                                   radius={[8, 8, 0, 0]}
                              />
                              <Bar
                                   dataKey="proyectado"
                                   fill="#87CEEB"
                                   name="Proyección"
                                   radius={[8, 8, 0, 0]}
                                   opacity={0.7}
                              />
                         </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                         <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded bg-green-500"></div>
                              <span className="text-muted-foreground">Ventas Reales</span>
                         </div>
                         <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded bg-[#87CEEB] opacity-70"></div>
                              <span className="text-muted-foreground">Proyección</span>
                         </div>
                    </div>
               </CardContent>
          </Card>
     );
}
