"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AnimatedSalesChartProps {
     period: 'day' | 'week' | 'month';
     onPeriodChange: (period: 'day' | 'week' | 'month') => void;
}

export function AnimatedSalesChart({ period, onPeriodChange }: AnimatedSalesChartProps) {
     const [animated, setAnimated] = useState(false);

     // Mock data - replace with real data later
     const getData = () => {
          if (period === 'day') {
               return [
                    { label: '00:00', value: 0 },
                    { label: '04:00', value: 2 },
                    { label: '08:00', value: 5 },
                    { label: '12:00', value: 15 },
                    { label: '16:00', value: 25 },
                    { label: '20:00', value: 35 },
                    { label: '23:59', value: 40 },
               ];
          } else if (period === 'week') {
               return [
                    { label: 'Lun', value: 120 },
                    { label: 'Mar', value: 150 },
                    { label: 'Mié', value: 180 },
                    { label: 'Jue', value: 200 },
                    { label: 'Vie', value: 280 },
                    { label: 'Sáb', value: 350 },
                    { label: 'Dom', value: 300 },
               ];
          } else {
               return [
                    { label: 'Sem 1', value: 800 },
                    { label: 'Sem 2', value: 1200 },
                    { label: 'Sem 3', value: 1500 },
                    { label: 'Sem 4', value: 1800 },
               ];
          }
     };

     const data = getData();
     const maxValue = Math.max(...data.map(d => d.value));

     useEffect(() => {
          setAnimated(false);
          const timer = setTimeout(() => setAnimated(true), 100);
          return () => clearTimeout(timer);
     }, [period]);

     // Calculate total
     const total = data.reduce((sum, d) => sum + d.value, 0);

     return (
          <Card className="neumorphic border-0">
               <CardHeader className="pb-2 px-3 md:px-4 pt-3 md:pt-4">
                    <div className="flex items-start justify-between mb-2">
                         <div>
                              <CardTitle className="text-lg md:text-xl font-bold">📊 Ventas</CardTitle>
                              <CardDescription className="text-[10px] md:text-xs">
                                   {period === 'day' && 'Hoy'}
                                   {period === 'week' && 'Esta semana'}
                                   {period === 'month' && 'Este mes'}
                              </CardDescription>
                         </div>
                         <div className="text-right">
                              <p className="text-xl md:text-2xl font-black text-primary" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                   ${total.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-muted-foreground">Total</p>
                         </div>
                    </div>

                    {/* Period Selector */}
                    <div className="flex gap-1">
                         <Button
                              variant={period === 'day' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => onPeriodChange('day')}
                              className="text-[10px] md:text-xs flex-1 h-7"
                         >
                              Día
                         </Button>
                         <Button
                              variant={period === 'week' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => onPeriodChange('week')}
                              className="text-[10px] md:text-xs flex-1 h-7"
                         >
                              Semana
                         </Button>
                         <Button
                              variant={period === 'month' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => onPeriodChange('month')}
                              className="text-[10px] md:text-xs flex-1 h-7"
                         >
                              Mes
                         </Button>
                    </div>
               </CardHeader>
               <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
                    {/* Chart */}
                    <div className="relative h-32 md:h-40">
                         <svg className="w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="none">
                              {/* Grid lines */}
                              {[0, 1, 2, 3].map((i) => (
                                   <line
                                        key={i}
                                        x1="0"
                                        y1={i * 35}
                                        x2="400"
                                        y2={i * 35}
                                        stroke="currentColor"
                                        strokeWidth="0.5"
                                        className="text-muted-foreground/20"
                                   />
                              ))}

                              {/* Line chart */}
                              <polyline
                                   points={data.map((d, i) => {
                                        const x = (i / (data.length - 1)) * 400;
                                        const y = 140 - (d.value / maxValue) * 120;
                                        return `${x},${y}`;
                                   }).join(' ')}
                                   fill="none"
                                   stroke="hsl(var(--primary))"
                                   strokeWidth="2.5"
                                   strokeLinecap="round"
                                   strokeLinejoin="round"
                                   strokeDasharray={animated ? "0" : "1000"}
                                   strokeDashoffset={animated ? "0" : "1000"}
                                   style={{
                                        transition: 'stroke-dashoffset 1.5s ease-in-out'
                                   }}
                              />

                              {/* Points */}
                              {data.map((d, i) => {
                                   const x = (i / (data.length - 1)) * 400;
                                   const y = 140 - (d.value / maxValue) * 120;
                                   return (
                                        <circle
                                             key={i}
                                             cx={x}
                                             cy={y}
                                             r="3"
                                             fill="hsl(var(--primary))"
                                             className="transition-opacity duration-500"
                                             style={{
                                                  opacity: animated ? 1 : 0,
                                                  transitionDelay: `${i * 150}ms`
                                             }}
                                        />
                                   );
                              })}
                         </svg>

                         {/* Labels */}
                         <div className="flex justify-between mt-1">
                              {data.map((d, i) => (
                                   <span key={i} className="text-[9px] md:text-[10px] text-muted-foreground">
                                        {d.label}
                                   </span>
                              ))}
                         </div>
                    </div>
               </CardContent>
          </Card>
     );
}
