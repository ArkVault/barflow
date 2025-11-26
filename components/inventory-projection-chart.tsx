"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from "lucide-react";

interface InventoryProjectionProps {
     period: 'week' | 'month';
     highSeason: boolean;
}

// Función de regresión lineal simple
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

// Función para proyectar valores futuros
function projectFutureValues(historicalData: number[], futurePoints: number, highSeasonMultiplier: number = 1.0): number[] {
     const { slope, intercept } = linearRegression(historicalData);
     const projections: number[] = [];

     for (let i = historicalData.length; i < historicalData.length + futurePoints; i++) {
          const projected = (slope * i + intercept) * highSeasonMultiplier;
          projections.push(Math.max(0, projected)); // No permitir valores negativos
     }

     return projections;
}

export function InventoryProjectionChart({ period, highSeason }: InventoryProjectionProps) {
     const [selectedProduct, setSelectedProduct] = useState<string>('all');
     const [chartData, setChartData] = useState<any[]>([]);

     // Mock de productos más demandados (esto vendrá de la base de datos)
     const topProducts = [
          { value: 'all', label: 'Todos los Insumos', demand: 1000 },
          { value: 'ron', label: 'Ron Blanco', demand: 250 },
          { value: 'vodka', label: 'Vodka Premium', demand: 220 },
          { value: 'limon', label: 'Jugo de Limón', demand: 180 },
          { value: 'azucar', label: 'Azúcar', demand: 150 },
          { value: 'hielo', label: 'Hielo', demand: 140 },
          { value: 'menta', label: 'Menta Fresca', demand: 120 },
          { value: 'tequila', label: 'Tequila', demand: 110 },
          { value: 'naranja', label: 'Jugo de Naranja', demand: 95 },
          { value: 'granadina', label: 'Granadina', demand: 85 },
          { value: 'triple_sec', label: 'Triple Sec', demand: 75 },
     ];

     useEffect(() => {
          generateProjections();
     }, [period, highSeason, selectedProduct]);

     const generateProjections = () => {
          // Datos históricos simulados (esto vendrá de la base de datos)
          const historicalInventory = period === 'week'
               ? [50, 47, 45, 42, 40, 38, 35] // Últimos 7 días
               : [180, 165, 150, 135]; // Últimas 4 semanas

          // Multiplicador de temporada alta (30% más de consumo)
          const seasonMultiplier = highSeason ? 1.3 : 1.0;

          // Proyectar valores futuros
          const futurePoints = period === 'week' ? 7 : 4;
          const projectedValues = projectFutureValues(historicalInventory, futurePoints, seasonMultiplier);

          // Generar datos para la gráfica
          const labels = period === 'week'
               ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
               : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];

          const data = [];

          // Datos históricos
          for (let i = 0; i < historicalInventory.length; i++) {
               data.push({
                    day: labels[i],
                    actual: historicalInventory[i],
                    proyectado: null,
                    minimo: 30,
                    isHistorical: true
               });
          }

          // Datos proyectados
          for (let i = 0; i < futurePoints; i++) {
               data.push({
                    day: labels[historicalInventory.length + i] || `+${i + 1}`,
                    actual: null,
                    proyectado: Math.round(projectedValues[i]),
                    minimo: 30,
                    isHistorical: false
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
                                   Proyección de Inventario
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
                                        <span className="font-semibold">📊 Todos los Insumos</span>
                                   </SelectItem>
                                   <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                        Top 10 Más Demandados
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
                         <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                              <XAxis
                                   dataKey="day"
                                   stroke="rgba(255,255,255,0.5)"
                                   style={{ fontSize: '12px' }}
                              />
                              <YAxis
                                   stroke="rgba(255,255,255,0.5)"
                                   style={{ fontSize: '12px' }}
                                   label={{ value: 'Unidades', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                              />
                              <Tooltip
                                   contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '8px'
                                   }}
                                   formatter={(value: any) => [value ? `${value} unidades` : 'N/A', '']}
                              />
                              <Legend />
                              <Line
                                   type="monotone"
                                   dataKey="actual"
                                   stroke="#4A90E2"
                                   strokeWidth={3}
                                   name="Inventario Real"
                                   dot={{ fill: '#4A90E2', r: 5 }}
                                   connectNulls={false}
                              />
                              <Line
                                   type="monotone"
                                   dataKey="proyectado"
                                   stroke="#87CEEB"
                                   strokeWidth={3}
                                   strokeDasharray="8 4"
                                   name={`Proyección ${highSeason ? '(Temp. Alta)' : ''}`}
                                   dot={{ fill: '#87CEEB', r: 5 }}
                                   connectNulls={false}
                              />
                              <Line
                                   type="monotone"
                                   dataKey="minimo"
                                   stroke="#ef4444"
                                   strokeWidth={2}
                                   strokeDasharray="3 3"
                                   name="Nivel Crítico"
                                   dot={false}
                              />
                         </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                         <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#4A90E2]"></div>
                              <span className="text-muted-foreground">Inventario Real</span>
                         </div>
                         <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#87CEEB]"></div>
                              <span className="text-muted-foreground">Proyección (Regresión)</span>
                         </div>
                         <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-muted-foreground">Nivel Crítico</span>
                         </div>
                    </div>
                    {highSeason && (
                         <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                   ⚠️ Temporada Alta: Proyección ajustada con +30% de demanda
                              </p>
                         </div>
                    )}
               </CardContent>
          </Card>
     );
}
