"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/hooks/use-language';

interface InventoryProjectionProps {
     period: 'week' | 'month';
     highSeason: boolean;
}

interface Supply {
     id: string;
     name: string;
     current_quantity: number;
}

// Función de regresión lineal con patrón de fin de semana
function linearRegressionWithWeekendPattern(data: number[], isWeekend: boolean[] = []): { slope: number; intercept: number } {
     const n = data.length;
     const sumX = data.reduce((sum, _, i) => sum + i, 0);
     const sumY = data.reduce((sum, y) => sum + y, 0);
     const sumXY = data.reduce((sum, y, i) => sum + i * y, 0);
     const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);

     const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
     const intercept = (sumY - slope * sumX) / n;

     return { slope, intercept };
}

// Función para proyectar valores futuros con patrón de fin de semana
function projectFutureValues(
     historicalData: number[],
     futurePoints: number,
     highSeasonMultiplier: number = 1.0,
     period: 'week' | 'month' = 'week'
): number[] {
     const { slope, intercept } = linearRegressionWithWeekendPattern(historicalData);
     const projections: number[] = [];

     // Patrón de consumo: Viernes y Sábado tienen 40% más demanda
     const weekendMultipliers = period === 'week'
          ? [1.0, 1.0, 1.0, 1.0, 1.4, 1.4, 1.0] // Lun-Dom
          : [1.0, 1.0, 1.0, 1.0]; // Semanas

     for (let i = historicalData.length; i < historicalData.length + futurePoints; i++) {
          const baseProjection = slope * i + intercept;
          const dayMultiplier = period === 'week' ? weekendMultipliers[i % 7] : 1.0;
          const projected = baseProjection * dayMultiplier * highSeasonMultiplier;
          projections.push(Math.max(0, projected));
     }

     return projections;
}

export function InventoryProjectionChart({ period, highSeason }: InventoryProjectionProps) {
     const { t, language } = useLanguage();
     const [selectedProduct, setSelectedProduct] = useState<string>('all');
     const [chartData, setChartData] = useState<any[]>([]);
     const [supplies, setSupplies] = useState<Supply[]>([]);
     const [loading, setLoading] = useState(true);
     const { establishmentId } = useAuth();

     useEffect(() => {
          if (establishmentId) {
               loadSupplies();
          }
     }, [establishmentId]);

     useEffect(() => {
          generateProjections();
     }, [period, highSeason, selectedProduct, supplies, language]);

     const loadSupplies = async () => {
          try {
               const supabase = createClient();
               const { data, error } = await supabase
                    .from('supplies')
                    .select('id, name, current_quantity')
                    .eq('establishment_id', establishmentId)
                    .order('name', { ascending: true });

               if (!error && data) {
                    setSupplies(data);
               }
          } catch (error) {
               console.error('Error loading supplies:', error);
          } finally {
               setLoading(false);
          }
     };

     const generateProjections = () => {
          // Datos históricos simulados (esto vendrá de la base de datos)
          const historicalInventory = period === 'week'
               ? [50, 47, 45, 42, 38, 35, 40] // Últimos 7 días (nota: baja más Vie-Sáb)
               : [180, 165, 150, 135]; // Últimas 4 semanas

          // Multiplicador de temporada alta (30% más de consumo)
          const seasonMultiplier = highSeason ? 1.3 : 1.0;

          // Proyectar valores futuros (mismo número de puntos que históricos para superposición)
          const futurePoints = historicalInventory.length;
          const projectedValues = projectFutureValues(historicalInventory, futurePoints, seasonMultiplier, period);

          // Generar datos para la gráfica
          const labels = period === 'week'
               ? language === 'es'
                    ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
                    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
               : language === 'es'
                    ? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
                    : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

          const data = [];

          // Superponer datos reales y proyectados en la misma temporalidad
          for (let i = 0; i < historicalInventory.length; i++) {
               data.push({
                    day: labels[i],
                    actual: historicalInventory[i],
                    proyectado: Math.round(projectedValues[i]),
                    minimo: 30,
                    isHistorical: true
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
                                   {t('inventoryProjection')}
                              </CardTitle>
                              <CardDescription>
                                   {language === 'es'
                                        ? `Comparación superpuesta: Real (azul) vs Proyección (morado) ${highSeason ? '(Temporada Alta)' : ''}`
                                        : `Overlaid comparison: Actual (blue) vs Projection (purple) ${highSeason ? '(High Season)' : ''}`
                                   }
                              </CardDescription>
                         </div>
                         <Select value={selectedProduct} onValueChange={setSelectedProduct} disabled={loading}>
                              <SelectTrigger className="w-[220px]">
                                   <SelectValue placeholder={loading
                                        ? (language === 'es' ? "Cargando..." : "Loading...")
                                        : (language === 'es' ? "Seleccionar insumo" : "Select supply")} />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="all">
                                        <span className="font-semibold">📊 {language === 'es' ? 'Todos los Insumos' : 'All Supplies'}</span>
                                   </SelectItem>
                                   {supplies.length > 0 && (
                                        <>
                                             <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                  🔥 {language === 'es' ? 'Top 10 Más Demanda' : 'Top 10 Most Demanded'}
                                             </div>
                                             {supplies.slice(0, 10).map(supply => (
                                                  <SelectItem key={supply.id} value={supply.id}>
                                                       {supply.name}
                                                  </SelectItem>
                                             ))}
                                             {supplies.length > 10 && (
                                                  <>
                                                       <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                                                            {language === 'es' ? 'Otros Insumos' : 'Other Supplies'}
                                                       </div>
                                                       {supplies.slice(10).map(supply => (
                                                            <SelectItem key={supply.id} value={supply.id}>
                                                                 {supply.name}
                                                            </SelectItem>
                                                       ))}
                                                  </>
                                             )}
                                        </>
                                   )}
                              </SelectContent>
                         </Select>
                    </div>
               </CardHeader>
               <CardContent className="px-3 pb-2">
                    <ResponsiveContainer width="100%" height={160}>
                         <LineChart data={chartData}>
                              <defs>
                                   {/* Gradiente para línea de inventario real */}
                                   <linearGradient id="actualGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#4A90E2" stopOpacity={1} />
                                        <stop offset="50%" stopColor="#5AB9EA" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#87CEEB" stopOpacity={1} />
                                   </linearGradient>

                                   {/* Gradiente para línea proyectada - MORADO */}
                                   <linearGradient id="projectedGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#9333EA" stopOpacity={1} />
                                        <stop offset="50%" stopColor="#A855F7" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#C084FC" stopOpacity={1} />
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
                                        value: 'Unidades',
                                        angle: -90,
                                        position: 'insideLeft',
                                        className: 'opacity-50 dark:opacity-50',
                                        style: { fontSize: '11px' }
                                   }}
                              />
                              <Tooltip
                                   contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.9)',
                                        border: '1px solid rgba(135, 206, 235, 0.3)',
                                        borderRadius: '12px',
                                        boxShadow: '0 0 20px rgba(135, 206, 235, 0.2)'
                                   }}
                                   formatter={(value: any) => [value ? `${value} ${language === 'es' ? 'unidades' : 'units'}` : 'N/A', '']}
                                   labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}
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

                              {/* Línea proyectada con efecto neon - MORADO */}
                              <Line
                                   type="monotone"
                                   dataKey="proyectado"
                                   stroke="url(#projectedGradient)"
                                   strokeWidth={4}
                                   strokeDasharray="8 4"
                                   name={`Proyección ${highSeason ? '(Temp. Alta)' : ''}`}
                                   dot={{
                                        fill: '#9333EA',
                                        r: 6,
                                        strokeWidth: 2,
                                        stroke: '#fff',
                                        filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.8))'
                                   }}
                                   activeDot={{
                                        r: 8,
                                        fill: '#9333EA',
                                        stroke: '#fff',
                                        strokeWidth: 2,
                                        filter: 'drop-shadow(0 0 12px rgba(147, 51, 234, 1))'
                                   }}
                                   connectNulls={false}
                                   filter="drop-shadow(0 0 8px rgba(147, 51, 234, 0.6))"
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
                              <span className="text-muted-foreground font-medium">{language === 'es' ? 'Inventario Real' : 'Actual Inventory'}</span>
                         </div>
                         <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#9333EA] to-[#C084FC]"
                                   style={{ boxShadow: '0 0 8px rgba(147, 51, 234, 0.6)' }}></div>
                              <span className="text-muted-foreground font-medium">{language === 'es' ? 'Proyección' : 'Projection'}</span>
                         </div>
                         <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-red-300"
                                   style={{ boxShadow: '0 0 6px rgba(239, 68, 68, 0.4)' }}></div>
                              <span className="text-muted-foreground font-medium">{language === 'es' ? 'Nivel Crítico' : 'Critical Level'}</span>
                         </div>
                    </div>

                    {highSeason && (
                         <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                              style={{ boxShadow: '0 0 12px rgba(245, 158, 11, 0.1)' }}>
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                   ⚠️ {language === 'es' ? 'Temporada Alta: Proyección ajustada con +30% de demanda' : 'High Season: Projection adjusted with +30% demand'}
                              </p>
                         </div>
                    )}

                    <div className="mt-3 p-2 rounded bg-muted/30 border border-muted/50">
                         <p className="text-xs text-muted-foreground">
                              💡 <strong>{language === 'es' ? 'Patrón de fin de semana:' : 'Weekend pattern:'}</strong> {language === 'es' ? 'Viernes y Sábado tienen +40% más consumo' : 'Friday and Saturday have +40% more consumption'}
                         </p>
                    </div>
               </CardContent>
          </Card>
     );
}
