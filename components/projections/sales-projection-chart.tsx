"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/hooks/use-language';
import type { Product } from "@/types";
import { projectFutureValues as projectFutureSales } from '@/lib/projection-utils';

interface SalesProjectionProps {
     period: 'week' | 'month';
     highSeason: boolean;
}

export function SalesProjectionChart({ period, highSeason }: SalesProjectionProps) {
     const { language } = useLanguage();
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
          if (establishmentId) {
               generateProjections();
          }
     }, [period, highSeason, selectedProduct, products, language, establishmentId]);

     const loadProducts = async () => {
          try {
               const supabase = createClient();

               // First, get active menus for this establishment
               const { data: menus, error: menuError } = await supabase
                    .from('menus')
                    .select('id')
                    .eq('establishment_id', establishmentId)
                    .or('is_active.eq.true,is_secondary_active.eq.true');

               if (menuError) {
                    console.error('Error loading menus:', menuError);
                    setLoading(false);
                    return;
               }

               if (!menus || menus.length === 0) {
                    setProducts([]);
                    setLoading(false);
                    return;
               }

               const menuIds = menus.map(m => m.id);

               // Then, get products from those menus
               const { data, error } = await supabase
                    .from('products')
                    .select('id, name, menu_id')
                    .in('menu_id', menuIds)
                    .eq('is_active', true)
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

     const generateProjections = async () => {
          try {
               const supabase = createClient();

               // Calculate date range based on period
               const now = new Date();
               const startDate = new Date();

               if (period === 'week') {
                    startDate.setDate(now.getDate() - 6); // Last 7 days
               } else {
                    startDate.setDate(now.getDate() - 27); // Last 4 weeks (28 days)
               }
               startDate.setHours(0, 0, 0, 0);

               // Fetch sales from Supabase
               const { data: salesData, error } = await supabase
                    .from('sales')
                    .select('id, total, created_at, items')
                    .eq('establishment_id', establishmentId)
                    .gte('created_at', startDate.toISOString())
                    .order('created_at', { ascending: true });

               if (error) {
                    console.error('Error fetching sales:', error);
                    return;
               }

               // Group sales by day or week
               const salesByPeriod: Record<string, number> = {};

               (salesData || []).forEach((sale: any) => {
                    const saleDate = new Date(sale.created_at);
                    let key: string;

                    if (period === 'week') {
                         key = saleDate.toISOString().split('T')[0];
                    } else {
                         const weekNumber = Math.floor((saleDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
                         key = `week-${weekNumber}`;
                    }

                    if (!salesByPeriod[key]) {
                         salesByPeriod[key] = 0;
                    }

                    // Filter by selected product if needed
                    const items = sale.items || [];
                    let itemCount = 0;

                    if (selectedProduct === 'all') {
                         itemCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
                    } else {
                         const selectedProductData = products.find(p => p.id === selectedProduct);
                         if (selectedProductData) {
                              items.forEach((item: any) => {
                                   // Handle different field names: productName (from sales) or name
                                   const itemName = item.productName || item.name || item.product_name || '';
                                   if (itemName === selectedProductData.name) {
                                        itemCount += item.quantity || 1;
                                   }
                              });
                         }
                    }

                    salesByPeriod[key] += itemCount;
               });

               // Build historical sales array
               const historicalSales: number[] = [];
               const numPeriods = period === 'week' ? 7 : 4;

               for (let i = 0; i < numPeriods; i++) {
                    if (period === 'week') {
                         const date = new Date(startDate);
                         date.setDate(startDate.getDate() + i);
                         const dateKey = date.toISOString().split('T')[0];
                         historicalSales.push(salesByPeriod[dateKey] || 0);
                    } else {
                         historicalSales.push(salesByPeriod[`week-${i}`] || 0);
                    }
               }

               // Project future sales
               const seasonMultiplier = highSeason ? 1.4 : 1.0;
               const projectedSales = projectFutureSales(historicalSales, numPeriods, seasonMultiplier, period);

               // Generate labels
               const labels = period === 'week'
                    ? language === 'es'
                         ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
                         : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                    : language === 'es'
                         ? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
                         : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

               // Build chart data - overlay actual and projected on same time periods
               const data = [];

               for (let i = 0; i < numPeriods; i++) {
                    data.push({
                         day: labels[i],
                         ventas: historicalSales[i],
                         proyectado: projectedSales[i]
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
                                   {language === 'es' ? 'Proyección de Ventas' : 'Sales Projection'}
                              </CardTitle>
                              <CardDescription>
                                   {language === 'es'
                                        ? `Real (verde) vs Proyección (naranja) ${highSeason ? '(Temporada Alta)' : ''}`
                                        : `Actual (green) vs Projection (orange) ${highSeason ? '(High Season)' : ''}`}
                              </CardDescription>
                         </div>
                         <Select value={selectedProduct} onValueChange={setSelectedProduct} disabled={loading}>
                              <SelectTrigger className="w-[220px]">
                                   <SelectValue placeholder={loading
                                        ? (language === 'es' ? "Cargando..." : "Loading...")
                                        : (language === 'es' ? "Seleccionar producto" : "Select product")} />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="all">
                                        <span className="font-semibold">📊 {language === 'es' ? 'Todos los Productos' : 'All Products'}</span>
                                   </SelectItem>
                                   {products.length > 0 && (
                                        <>
                                             <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                  🔥 {language === 'es' ? 'Productos' : 'Products'}
                                             </div>
                                             {products.slice(0, 15).map(product => (
                                                  <SelectItem key={product.id} value={product.id}>
                                                       {product.name}
                                                  </SelectItem>
                                             ))}
                                             {products.length > 15 && (
                                                  <>
                                                       <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                                                            {language === 'es' ? 'Otros Productos' : 'Other Products'}
                                                       </div>
                                                       {products.slice(15).map(product => (
                                                            <SelectItem key={product.id} value={product.id}>
                                                                 {product.name}
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
                                   {language === 'es' ? 'Cargando proyecciones...' : 'Loading projections...'}
                              </span>
                         </div>
                    ) : (
                         <ResponsiveContainer width="100%" height={160}>
                              <LineChart data={chartData}>
                                   <defs>
                                        <linearGradient id="salesActualGradient" x1="0" y1="0" x2="1" y2="0">
                                             <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                             <stop offset="50%" stopColor="#22c55e" stopOpacity={1} />
                                             <stop offset="100%" stopColor="#4ade80" stopOpacity={1} />
                                        </linearGradient>
                                        <linearGradient id="salesProjectedGradient" x1="0" y1="0" x2="1" y2="0">
                                             <stop offset="0%" stopColor="#ea580c" stopOpacity={1} />
                                             <stop offset="50%" stopColor="#f97316" stopOpacity={1} />
                                             <stop offset="100%" stopColor="#fb923c" stopOpacity={1} />
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
                                             value: language === 'es' ? 'Ventas' : 'Sales',
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
                                        formatter={(value: any) => [value ? `${value} ${language === 'es' ? 'ventas' : 'sales'}` : '0', '']}
                                        labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}
                                   />
                                   <Legend
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        iconType="circle"
                                   />

                                   <Line
                                        type="monotone"
                                        dataKey="ventas"
                                        stroke="url(#salesActualGradient)"
                                        strokeWidth={4}
                                        name={language === 'es' ? 'Ventas Reales' : 'Actual Sales'}
                                        dot={{
                                             fill: '#22c55e',
                                             r: 6,
                                             strokeWidth: 2,
                                             stroke: '#fff',
                                             filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.8))'
                                        }}
                                        activeDot={{
                                             r: 8,
                                             fill: '#22c55e',
                                             stroke: '#fff',
                                             strokeWidth: 2,
                                             filter: 'drop-shadow(0 0 12px rgba(34, 197, 94, 1))'
                                        }}
                                        connectNulls={false}
                                        filter="drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))"
                                   />

                                   <Line
                                        type="monotone"
                                        dataKey="proyectado"
                                        stroke="url(#salesProjectedGradient)"
                                        strokeWidth={4}
                                        strokeDasharray="8 4"
                                        name={language === 'es' ? `Proyección ${highSeason ? '(Temp. Alta)' : ''}` : `Projection ${highSeason ? '(High Season)' : ''}`}
                                        dot={{
                                             fill: '#f97316',
                                             r: 6,
                                             strokeWidth: 2,
                                             stroke: '#fff',
                                             filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.8))'
                                        }}
                                        activeDot={{
                                             r: 8,
                                             fill: '#f97316',
                                             stroke: '#fff',
                                             strokeWidth: 2,
                                             filter: 'drop-shadow(0 0 12px rgba(249, 115, 22, 1))'
                                        }}
                                        connectNulls={false}
                                        filter="drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))"
                                   />
                              </LineChart>
                         </ResponsiveContainer>
                    )}

                    <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                         <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#10b981] to-[#4ade80]"
                                   style={{ boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)' }}></div>
                              <span className="text-muted-foreground font-medium">{language === 'es' ? 'Ventas Reales' : 'Actual Sales'}</span>
                         </div>
                         <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#ea580c] to-[#fb923c]"
                                   style={{ boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)' }}></div>
                              <span className="text-muted-foreground font-medium">{language === 'es' ? 'Proyección' : 'Projection'}</span>
                         </div>
                    </div>

                    {highSeason && (
                         <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                              style={{ boxShadow: '0 0 12px rgba(245, 158, 11, 0.1)' }}>
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                   ⚠️ {language === 'es' ? 'Temporada Alta: Proyección ajustada con +40% de ventas esperadas' : 'High Season: Projection adjusted with +40% expected sales'}
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
