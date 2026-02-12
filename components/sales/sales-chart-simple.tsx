"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/hooks/use-language';

interface SalesChartSimpleProps {
    period: 'week' | 'month';
}

interface DailySales {
    date: string;
    total: number;
    count: number;
}

export function SalesChartSimple({ period }: SalesChartSimpleProps) {
    const { t, language } = useLanguage();
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { establishmentId } = useAuth();

    useEffect(() => {
        if (establishmentId) {
            loadSalesData();
        }
    }, [period, language, establishmentId]);

    const loadSalesData = async () => {
        try {
            setLoading(true);
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
                setChartData([]);
                return;
            }

            // Group sales by day or week
            const salesByPeriod: Record<string, { total: number; count: number }> = {};

            (salesData || []).forEach((sale: any) => {
                const saleDate = new Date(sale.created_at);
                let key: string;

                if (period === 'week') {
                    // Group by day
                    key = saleDate.toISOString().split('T')[0];
                } else {
                    // Group by week number
                    const weekNumber = Math.floor((saleDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
                    key = `week-${weekNumber}`;
                }

                if (!salesByPeriod[key]) {
                    salesByPeriod[key] = { total: 0, count: 0 };
                }

                // Count items sold
                const items = sale.items || [];
                const itemCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);

                salesByPeriod[key].total += sale.total || 0;
                salesByPeriod[key].count += itemCount;
            });

            // Generate chart data with labels
            const data = [];

            if (period === 'week') {
                const dayLabels = language === 'es'
                    ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
                    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                for (let i = 0; i < 7; i++) {
                    const date = new Date(startDate);
                    date.setDate(startDate.getDate() + i);
                    const dateKey = date.toISOString().split('T')[0];
                    const dayOfWeek = date.getDay();

                    data.push({
                        day: dayLabels[dayOfWeek],
                        ventas: salesByPeriod[dateKey]?.count || 0,
                        total: salesByPeriod[dateKey]?.total || 0
                    });
                }
            } else {
                const weekLabels = language === 'es'
                    ? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
                    : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

                for (let i = 0; i < 4; i++) {
                    data.push({
                        day: weekLabels[i],
                        ventas: salesByPeriod[`week-${i}`]?.count || 0,
                        total: salesByPeriod[`week-${i}`]?.total || 0
                    });
                }
            }

            setChartData(data);
        } catch (error) {
            console.error('Error loading sales data:', error);
            setChartData([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="neumorphic border-0">
            <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {t('sales')}
                </CardTitle>
                <CardDescription className="text-[10px]">
                    {language === 'es'
                        ? `Ventas reales de la ${period === 'week' ? 'semana' : 'mes'}`
                        : `Actual sales for the ${period === 'week' ? 'week' : 'month'}`
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-2">
                {loading ? (
                    <div className="h-[160px] w-full animate-pulse bg-muted/20 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                            {language === 'es' ? 'Cargando ventas...' : 'Loading sales...'}
                        </span>
                    </div>
                ) : chartData.length === 0 || chartData.every(d => d.ventas === 0) ? (
                    <div className="h-[160px] w-full flex items-center justify-center bg-muted/10 rounded-lg">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                                {language === 'es' ? 'No hay ventas en este período' : 'No sales in this period'}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                {language === 'es' ? 'Las ventas aparecerán aquí' : 'Sales will appear here'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={chartData}>
                            <defs>
                                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
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
                                style={{ fontSize: '10px', fontWeight: '500' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="currentColor"
                                className="opacity-50 dark:opacity-30"
                                style={{ fontSize: '10px', fontWeight: '500' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.9)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    borderRadius: '8px',
                                    boxShadow: '0 0 12px rgba(34, 197, 94, 0.2)'
                                }}
                                formatter={(value: any, name: string) => {
                                    if (name === 'ventas') {
                                        return [`${value} ${language === 'es' ? 'productos' : 'products'}`, language === 'es' ? 'Vendidos' : 'Sold'];
                                    }
                                    return [value, name];
                                }}
                                labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="ventas"
                                fill="url(#salesGradient)"
                                stroke="none"
                            />
                            <Line
                                type="monotone"
                                dataKey="ventas"
                                stroke="#22c55e"
                                strokeWidth={4}
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
                                filter="drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
