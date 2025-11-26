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
                    <ResponsiveContainer width="100%" height={340}>
                         <LineChart data={chartData}>
                              <defs>
                                   {/* Gradiente para línea de inventario real */}
                                   <linearGradient id="actualGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#4A90E2" stopOpacity={1} />
                                        <stop offset="50%" stopColor="#5AB9EA" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#87CEEB" stopOpacity={1} />
                                   </linearGradient>

                                   {/* Gradiente para línea proyectada */}
                                   <linearGradient id="projectedGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#87CEEB" stopOpacity={0.9} />
                                        <stop offset="50%" stopColor="#B0E0E6" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#E0F4FF" stopOpacity={0.9} />
                                   </linearGradient>

                                   {/* Gradiente para línea crítica */}
                                   <linearGradient id="criticalGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="50%" stopColor="#f87171" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#fca5a5" stopOpacity={0.8} />
                                   </linearGradient>
                              </defs>

                              <CartesianGrid
                                   strokeDasharray="3 3"
                                   stroke="rgba(255,255,255,0.05)"
                                   vertical={false}
                              />
                              <XAxis
                                   dataKey="day"
                                   stroke="rgba(255,255,255,0.3)"
                                   style={{ fontSize: '11px', fontWeight: '500' }}
                                   axisLine={false}
                                   tickLine={false}
                              />
                              <YAxis
                                   stroke="rgba(255,255,255,0.3)"
                                   style={{ fontSize: '11px', fontWeight: '500' }}
                                   axisLine={false}
                                   tickLine={false}
                                   label={{
                                        value: 'Unidades',
                                        angle: -90,
                                        position: 'insideLeft',
                                        style: { fontSize: '11px', fill: 'rgba(255,255,255,0.5)' }
                                   }}
                              />
                              <Tooltip
                                   contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.9)',
                                        border: '1px solid rgba(135, 206, 235, 0.3)',
                                        borderRadius: '12px',
                                        boxShadow: '0 0 20px rgba(135, 206, 235, 0.2)'
                                   }}
                                   formatter={(value: any) => [value ? `${value} unidades` : 'N/A', '']}
                                   labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}
                              />
                              <Legend
                                   wrapperStyle={{ paddingTop: '20px' }}
                                   iconType="circle"
                              />

                              {/* Línea de inventario real con efecto neon */}
                              <Line
                                   type="monotone"
                                   dataKey="actual"
                                   stroke="url(#actualGradient)"
                                   strokeWidth={4}
                                   name="Inventario Real"
                                   dot={{
                                        fill: '#4A90E2',
                                        r: 6,
                                        strokeWidth: 2,
                                        stroke: '#fff',
                                        filter: 'drop-shadow(0 0 8px rgba(74, 144, 226, 0.8))'
                                   }}
                                   activeDot={{
                                        r: 8,
                                        fill: '#4A90E2',
                                        stroke: '#fff',
                                        strokeWidth: 2,
                                        filter: 'drop-shadow(0 0 12px rgba(74, 144, 226, 1))'
                                   }}
                                   connectNulls={false}
                                   filter="drop-shadow(0 0 8px rgba(74, 144, 226, 0.6))"
                              />

                              {/* Línea proyectada con efecto neon */}
                              <Line
                                   type="monotone"
                                   dataKey="proyectado"
                                   stroke="url(#projectedGradient)"
                                   strokeWidth={4}
                                   strokeDasharray="8 4"
                                   name={`Proyección ${highSeason ? '(Temp. Alta)' : ''}`}
                                   dot={{
                                        fill: '#87CEEB',
                                        r: 6,
                                        strokeWidth: 2,
                                        stroke: '#fff',
                                        filter: 'drop-shadow(0 0 8px rgba(135, 206, 235, 0.8))'
                                   }}
                                   activeDot={{
                                        r: 8,
                                        fill: '#87CEEB',
                                        stroke: '#fff',
                                        strokeWidth: 2,
                                        filter: 'drop-shadow(0 0 12px rgba(135, 206, 235, 1))'
                                   }}
                                   connectNulls={false}
                                   filter="drop-shadow(0 0 8px rgba(135, 206, 235, 0.6))"
                              />

                              {/* Línea crítica con efecto neon sutil */}
                              <Line
                                   type="monotone"
                                   dataKey="minimo"
                                   stroke="url(#criticalGradient)"
                                   strokeWidth={2}
                                   strokeDasharray="4 4"
                                   name="Nivel Crítico"
                                   dot={false}
                                   filter="drop-shadow(0 0 6px rgba(239, 68, 68, 0.4))"
                              />
                         </LineChart>
                    </ResponsiveContainer>

                    <div className="mt-6 grid grid-cols-3 gap-4 text-xs">
                         <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#4A90E2] to-[#87CEEB]"
                                   style={{ boxShadow: '0 0 8px rgba(74, 144, 226, 0.6)' }}></div>
                              <span className="text-muted-foreground font-medium">Inventario Real</span>
                         </div>
                         <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#87CEEB] to-[#E0F4FF]"
                                   style={{ boxShadow: '0 0 8px rgba(135, 206, 235, 0.6)' }}></div>
                              <span className="text-muted-foreground font-medium">Proyección</span>
                         </div>
                         <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-red-300"
                                   style={{ boxShadow: '0 0 6px rgba(239, 68, 68, 0.4)' }}></div>
                              <span className="text-muted-foreground font-medium">Nivel Crítico</span>
                         </div>
                    </div>

                    {highSeason && (
                         <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                              style={{ boxShadow: '0 0 12px rgba(245, 158, 11, 0.1)' }}>
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                   ⚠️ Temporada Alta: Proyección ajustada con +30% de demanda
                              </p>
                         </div>
                    )}
               </CardContent>
          </Card>
     );
}
