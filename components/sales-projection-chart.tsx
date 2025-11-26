"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';

interface SalesProjectionProps {
     period: 'week' | 'month';
     highSeason: boolean;
}

interface Product {
     id: string;
     name: string;
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

// Función para proyectar ventas futuras con patrón de fin de semana
function projectFutureSales(
     historicalData: number[],
     futurePoints: number,
     highSeasonMultiplier: number = 1.0,
     period: 'week' | 'month' = 'week'
): number[] {
     const { slope, intercept } = linearRegression(historicalData);
     const projections: number[] = [];

     // Patrón de ventas: Viernes y Sábado tienen 40% más ventas
     const weekendMultipliers = period === 'week'
          ? [1.0, 1.0, 1.0, 1.0, 1.4, 1.4, 1.0] // Lun-Dom
          : [1.0, 1.0, 1.0, 1.0]; // Semanas

     for (let i = historicalData.length; i < historicalData.length + futurePoints; i++) {
          const baseProjection = slope * i + intercept;
          const dayMultiplier = period === 'week' ? weekendMultipliers[i % 7] : 1.0;
          const projected = baseProjection * dayMultiplier * highSeasonMultiplier;
          projections.push(Math.max(0, Math.round(projected)));
     }

     return projections;
}

export function SalesProjectionChart({ period, highSeason }: SalesProjectionProps) {
     const [selectedProduct, setSelectedProduct] = useState<string>('all');
     const [chartData, setChartData] = useState<any[]>([]);
     const [products, setProducts] = useState<Product[]>([]);
     const [loading, setLoading] = useState(true);
     const { establishmentId } = useAuth();

     useEffect(() => {
          if (establishmentId) {
               loadProducts();
          }
     }, [establishmentId]);

     useEffect(() => {
          generateProjections();
     }, [period, highSeason, selectedProduct, products]);

     const loadProducts = async () => {
          try {
               const supabase = createClient();
               const { data, error } = await supabase
                    .from('products')
                    .select('id, name')
                    .eq('establishment_id', establishmentId)
                    .order('name', { ascending: true });

               if (!error && data) {
                    setProducts(data);
               }
          } catch (error) {
               console.error('Error loading products:', error);
          } finally {
               setLoading(false);
          }
     };

     const generateProjections = () => {
          // Datos históricos simulados con patrón de fin de semana
          const historicalSales = period === 'week'
               ? [42, 48, 45, 52, 72, 85, 68] // Últimos 7 días (nota: pico Vie-Sáb)
               : [280, 310, 340, 365]; // Últimas 4 semanas

          // Multiplicador de temporada alta (40% más de ventas)
          const seasonMultiplier = highSeason ? 1.4 : 1.0;

          // Proyectar ventas futuras
          const futurePoints = period === 'week' ? 7 : 4;
          const projectedSales = projectFutureSales(historicalSales, futurePoints, seasonMultiplier, period);

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
                                   Estimación con patrón de fin de semana {highSeason && '(Temporada Alta)'}
                              </CardDescription>
                         </div>
                         <Select value={selectedProduct} onValueChange={setSelectedProduct} disabled={loading}>
                              <SelectTrigger className="w-[220px]">
                                   <SelectValue placeholder={loading ? "Cargando..." : "Seleccionar producto"} />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="all">
                                        <span className="font-semibold">📊 Todos los Productos</span>
                                   </SelectItem>
                                   {products.length > 0 && (
                                        <>
                                             <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                  Productos Disponibles
                                             </div>
                                             {products.map(product => (
                                                  <SelectItem key={product.id} value={product.id}>
                                                       {product.name}
                                                  </SelectItem>
                                             ))}
                                        </>
                                   )}
                              </SelectContent>
                         </Select>
                    </div>
               </CardHeader>
               <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                         <BarChart data={chartData}>
                              <CartesianGrid
                                   strokeDasharray="3 3"
                                   stroke="currentColor"
                                   className="opacity-10 dark:opacity-5"
                                   vertical={false}
                              />
                              <XAxis
                                   dataKey="day"
                                   stroke="currentColor"
                                   className="opacity-50 dark:opacity-30"
                                   style={{ fontSize: '11px', fontWeight: '500' }}
                                   axisLine={false}
                                   tickLine={false}
                              />
                              <YAxis
                                   stroke="currentColor"
                                   className="opacity-50 dark:opacity-30"
                                   style={{ fontSize: '11px', fontWeight: '500' }}
                                   axisLine={false}
                                   tickLine={false}
                                   label={{
                                        value: 'Ventas',
                                        angle: -90,
                                        position: 'insideLeft',
                                        className: 'opacity-50 dark:opacity-50',
                                        style: { fontSize: '11px' }
                                   }}
                              />
                              <Tooltip
                                   contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.9)',
                                        border: '1px solid rgba(34, 197, 94, 0.3)',
                                        borderRadius: '12px',
                                        boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)'
                                   }}
                                   formatter={(value: any) => [value ? `${value} ventas` : 'N/A', '']}
                                   labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}
                              />
                              <Legend
                                   wrapperStyle={{ paddingTop: '20px' }}
                                   iconType="square"
                              />
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
                    <div className="mt-3 p-2 rounded bg-muted/30 border border-muted/50">
                         <p className="text-xs text-muted-foreground">
                              💡 <strong>Patrón de fin de semana:</strong> Viernes y Sábado tienen +40% más ventas
                         </p>
                    </div>
               </CardContent>
          </Card>
     );
}
