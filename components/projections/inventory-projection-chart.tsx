"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/hooks/use-language';
import type { Supply } from "@/types";
import { linearRegression, projectFutureValues } from '@/lib/projection-utils';

interface InventoryProjectionProps {
     period: 'week' | 'month';
     highSeason: boolean;
}

export function InventoryProjectionChart({ period, highSeason }: InventoryProjectionProps) {
     const { t, language } = useLanguage();
     const [selectedSupply, setSelectedSupply] = useState<string>('all');
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
          if (supplies.length > 0) {
               generateProjections();
          }
     }, [period, highSeason, selectedSupply, supplies, language]);

     const loadSupplies = async () => {
          try {
               const supabase = createClient();
               const { data, error } = await supabase
                    .from('supplies')
                    .select('id, name, current_quantity, unit, category, min_threshold, optimal_quantity')
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

     const generateProjections = async () => {
          try {
               const supabase = createClient();

               // Calculate date range for historical data
               const now = new Date();
               const startDate = new Date();

               if (period === 'week') {
                    startDate.setDate(now.getDate() - 6); // Last 7 days
               } else {
                    startDate.setDate(now.getDate() - 27); // Last 4 weeks
               }
               startDate.setHours(0, 0, 0, 0);

               // Fetch sales to calculate consumption
               const { data: salesData, error } = await supabase
                    .from('sales')
                    .select('id, items, created_at')
                    .eq('establishment_id', establishmentId)
                    .gte('created_at', startDate.toISOString())
                    .order('created_at', { ascending: true });

               if (error) {
                    console.error('Error fetching sales for projections:', error);
               }

               // Calculate consumption per day/week based on sales
               const consumptionByPeriod: Record<string, number> = {};

               (salesData || []).forEach((sale: any) => {
                    const saleDate = new Date(sale.created_at);
                    let key: string;

                    if (period === 'week') {
                         key = saleDate.toISOString().split('T')[0];
                    } else {
                         const weekNumber = Math.floor((saleDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
                         key = `week-${weekNumber}`;
                    }

                    if (!consumptionByPeriod[key]) {
                         consumptionByPeriod[key] = 0;
                    }

                    // Count items as approximate consumption units
                    const items = sale.items || [];
                    const itemCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
                    consumptionByPeriod[key] += itemCount;
               });

               // Get current inventory level
               const selectedSupplyData = selectedSupply === 'all'
                    ? null
                    : supplies.find(s => s.id === selectedSupply);

               const currentInventory = selectedSupplyData
                    ? selectedSupplyData.current_quantity
                    : supplies.reduce((sum, s) => sum + s.current_quantity, 0) / Math.max(supplies.length, 1);

               const optimalLevel = selectedSupplyData?.optimal_quantity || currentInventory * 1.5;
               const criticalLevel = optimalLevel * 0.2;

               // Build historical consumption array
               const historicalConsumption: number[] = [];
               const numPeriods = period === 'week' ? 7 : 4;

               for (let i = 0; i < numPeriods; i++) {
                    if (period === 'week') {
                         const date = new Date(startDate);
                         date.setDate(startDate.getDate() + i);
                         const dateKey = date.toISOString().split('T')[0];
                         historicalConsumption.push(consumptionByPeriod[dateKey] || 0);
                    } else {
                         historicalConsumption.push(consumptionByPeriod[`week-${i}`] || 0);
                    }
               }

               // Calculate inventory levels based on consumption
               const inventoryLevels: number[] = [];
               let runningInventory = currentInventory;

               // Work backwards from current inventory
               for (let i = historicalConsumption.length - 1; i >= 0; i--) {
                    inventoryLevels.unshift(runningInventory);
                    runningInventory += historicalConsumption[i]; // Add back what was consumed
               }

               // Project future inventory levels
               const seasonMultiplier = highSeason ? 1.3 : 1.0;
               const projectedConsumption = projectFutureValues(historicalConsumption, numPeriods, seasonMultiplier, period);

               const projectedInventory: number[] = [];
               let futureInventory = currentInventory;

               for (let i = 0; i < numPeriods; i++) {
                    futureInventory -= projectedConsumption[i];
                    projectedInventory.push(Math.max(0, Math.round(futureInventory)));
               }

               // Generate labels
               const labels = period === 'week'
                    ? language === 'es'
                         ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
                         : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                    : language === 'es'
                         ? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
                         : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

               // Build chart data
               const data = [];

               for (let i = 0; i < numPeriods; i++) {
                    data.push({
                         day: labels[i],
                         actual: Math.round(inventoryLevels[i] || currentInventory),
                         proyectado: projectedInventory[i],
                         minimo: Math.round(criticalLevel)
                    });
               }

               setChartData(data);
          } catch (error) {
               console.error('Error generating projections:', error);
          }
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
                                        ? `Real (azul) vs Proyección (morado) ${highSeason ? '(Temporada Alta)' : ''}`
                                        : `Actual (blue) vs Projection (purple) ${highSeason ? '(High Season)' : ''}`
                                   }
                              </CardDescription>
                         </div>
                         <Select value={selectedSupply} onValueChange={setSelectedSupply} disabled={loading}>
                              <SelectTrigger className="w-[220px]">
                                   <SelectValue placeholder={loading
                                        ? (language === 'es' ? "Cargando..." : "Loading...")
                                        : (language === 'es' ? "Seleccionar insumo" : "Select supply")} />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="all">
                                        <span className="font-semibold">📊 {language === 'es' ? 'Promedio General' : 'General Average'}</span>
                                   </SelectItem>
                                   {supplies.length > 0 && (
                                        <>
                                             <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                  🔥 {language === 'es' ? 'Insumos' : 'Supplies'}
                                             </div>
                                             {supplies.slice(0, 15).map(supply => (
                                                  <SelectItem key={supply.id} value={supply.id}>
                                                       {supply.name}
                                                  </SelectItem>
                                             ))}
                                             {supplies.length > 15 && (
                                                  <>
                                                       <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                                                            {language === 'es' ? 'Otros Insumos' : 'Other Supplies'}
                                                       </div>
                                                       {supplies.slice(15).map(supply => (
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
                    {loading ? (
                         <div className="h-[160px] w-full animate-pulse bg-muted/20 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">
                                   {language === 'es' ? 'Cargando inventario...' : 'Loading inventory...'}
                              </span>
                         </div>
                    ) : (
                         <ResponsiveContainer width="100%" height={160}>
                              <LineChart data={chartData}>
                                   <defs>
                                        <linearGradient id="actualGradient" x1="0" y1="0" x2="1" y2="0">
                                             <stop offset="0%" stopColor="#4A90E2" stopOpacity={1} />
                                             <stop offset="50%" stopColor="#5AB9EA" stopOpacity={1} />
                                             <stop offset="100%" stopColor="#87CEEB" stopOpacity={1} />
                                        </linearGradient>
                                        <linearGradient id="projectedGradient" x1="0" y1="0" x2="1" y2="0">
                                             <stop offset="0%" stopColor="#9333EA" stopOpacity={1} />
                                             <stop offset="50%" stopColor="#A855F7" stopOpacity={1} />
                                             <stop offset="100%" stopColor="#C084FC" stopOpacity={1} />
                                        </linearGradient>
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
                                             value: language === 'es' ? 'Unidades' : 'Units',
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

                                   <Line
                                        type="monotone"
                                        dataKey="actual"
                                        stroke="url(#actualGradient)"
                                        strokeWidth={4}
                                        name={language === 'es' ? 'Inventario Real' : 'Actual Inventory'}
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

                                   <Line
                                        type="monotone"
                                        dataKey="proyectado"
                                        stroke="url(#projectedGradient)"
                                        strokeWidth={4}
                                        strokeDasharray="8 4"
                                        name={language === 'es' ? `Proyección ${highSeason ? '(Temp. Alta)' : ''}` : `Projection ${highSeason ? '(High Season)' : ''}`}
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

                                   <Line
                                        type="monotone"
                                        dataKey="minimo"
                                        stroke="url(#criticalGradient)"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        name={language === 'es' ? 'Nivel Crítico' : 'Critical Level'}
                                        dot={false}
                                        filter="drop-shadow(0 0 6px rgba(239, 68, 68, 0.4))"
                                   />
                              </LineChart>
                         </ResponsiveContainer>
                    )}

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
                              💡 <strong>{language === 'es' ? 'Basado en ventas reales:' : 'Based on real sales:'}</strong> {language === 'es' ? 'Proyecciones calculadas a partir del historial de ventas de tu establecimiento' : 'Projections calculated from your establishment sales history'}
                         </p>
                    </div>
               </CardContent>
          </Card>
     );
}
