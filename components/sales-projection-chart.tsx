"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from "lucide-react";

interface SalesProjectionProps {
     period: 'week' | 'month';
     highSeason: boolean;
}

// Función de regresión lineal
function linearRegression(data: number[]): { slope: number; intercept: number } {
     const n = data.length;
     const sumX = data.reduce((sum, _, i) => sum + i, 0);
     const sumY = data.reduce((sum, y) => sum + y, 0);
     const sumXY = data.reduce((sum, y, i) => sum + i * y, 0);
     const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);

     const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
     const intercept = (sumY - slope * sumX) / n;

     return { slope, intercept };
}

// Función para proyectar ventas futuras
function projectFutureSales(historicalData: number[], futurePoints: number, highSeasonMultiplier: number = 1.0): number[] {
     const { slope, intercept } = linearRegression(historicalData);
     const projections: number[] = [];

     for (let i = historicalData.length; i < historicalData.length + futurePoints; i++) {
          const projected = (slope * i + intercept) * highSeasonMultiplier;
          projections.push(Math.max(0, Math.round(projected)));
     }

     return projections;
}

export function SalesProjectionChart({ period, highSeason }: SalesProjectionProps) {
     const [selectedProduct, setSelectedProduct] = useState<string>('all');
     const [chartData, setChartData] = useState<any[]>([]);

     // Top 10 productos más vendidos (esto vendrá de la base de datos)
     const topProducts = [
          { value: 'all', label: 'Todos los Productos', sales: 1500 },
          { value: 'mojito', label: 'Mojito Clásico', sales: 320 },
          { value: 'margarita', label: 'Margarita', sales: 280 },
          { value: 'daiquiri', label: 'Daiquiri', sales: 250 },
          { value: 'pina_colada', label: 'Piña Colada', sales: 220 },
          { value: 'cosmopolitan', label: 'Cosmopolitan', sales: 180 },
          { value: 'manhattan', label: 'Manhattan', sales: 160 },
          { value: 'old_fashioned', label: 'Old Fashioned', sales: 145 },
          { value: 'negroni', label: 'Negroni', sales: 130 },
          { value: 'whiskey_sour', label: 'Whiskey Sour', sales: 115 },
          { value: 'mai_tai', label: 'Mai Tai', sales: 95 },
     ];

     useEffect(() => {
          generateProjections();
     }, [period, highSeason, selectedProduct]);

     const generateProjections = () => {
          // Datos históricos simulados (esto vendrá de la base de datos)
          const historicalSales = period === 'week'
               ? [42, 48, 45, 52, 58, 65, 72] // Últimos 7 días
               : [280, 310, 340, 365]; // Últimas 4 semanas

          // Multiplicador de temporada alta (40% más de ventas)
          const seasonMultiplier = highSeason ? 1.4 : 1.0;

          // Proyectar ventas futuras
          const futurePoints = period === 'week' ? 7 : 4;
          const projectedSales = projectFutureSales(historicalSales, futurePoints, seasonMultiplier);

          // Generar datos para la gráfica
          const labels = period === 'week'
               ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
               : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];

          const data = [];

          // Datos históricos
          for (let i = 0; i < historicalSales.length; i++) {
               data.push({
                    day: labels[i],
                    ventas: historicalSales[i],
                    proyectado: null
               });
          }

          // Datos proyectados
          for (let i = 0; i < futurePoints; i++) {
               data.push({
                    day: labels[historicalSales.length + i] || `+${i + 1}`,
                    ventas: null,
                    proyectado: projectedSales[i]
               });
          }

          setChartData(data);
     };

     return (
          <Card className="neumorphic border-0">
               <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                         <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                   <TrendingUp className="w-5 h-5" />
                                   Proyección de Ventas
                              </CardTitle>
                              <CardDescription>
                                   Estimación basada en regresión lineal {highSeason && '(Temporada Alta)'}
                              </CardDescription>
                         </div>
                         <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                              <SelectTrigger className="w-[220px]">
                                   <SelectValue placeholder="Seleccionar producto" />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="all">
                                        <span className="font-semibold">📊 Todos los Productos</span>
                                   </SelectItem>
                                   <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                        Top 10 Más Vendidos
                                   </div>
                                   {topProducts.slice(1).map(product => (
                                        <SelectItem key={product.value} value={product.value}>
                                             {product.label}
                                        </SelectItem>
                                   ))}
                              </SelectContent>
                         </Select>
                    </div>
               </CardHeader>
               <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                         <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                              <XAxis
                                   dataKey="day"
                                   stroke="rgba(255,255,255,0.5)"
                                   style={{ fontSize: '12px' }}
                              />
                              <YAxis
                                   stroke="rgba(255,255,255,0.5)"
                                   style={{ fontSize: '12px' }}
                                   label={{ value: 'Ventas', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                              />
                              <Tooltip
                                   contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '8px'
                                   }}
                                   formatter={(value: any) => [value ? `${value} ventas` : 'N/A', '']}
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
                                   name={`Proyección ${highSeason ? '(Temp. Alta)' : ''}`}
                                   radius={[8, 8, 0, 0]}
                                   opacity={0.8}
                              />
                         </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                         <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded bg-green-500"></div>
                              <span className="text-muted-foreground">Ventas Reales</span>
                         </div>
                         <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded bg-[#87CEEB] opacity-80"></div>
                              <span className="text-muted-foreground">Proyección (Regresión)</span>
                         </div>
                    </div>
                    {highSeason && (
                         <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                   ⚠️ Temporada Alta: Proyección ajustada con +40% de ventas esperadas
                              </p>
                         </div>
                    )}
               </CardContent>
          </Card>
     );
}
