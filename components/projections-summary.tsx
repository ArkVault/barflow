"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectionsSummary() {
     // Mock data - replace with real projections data
     const projections = [
          { name: 'Vodka', daysLeft: 3, trend: 'down' },
          { name: 'Ron', daysLeft: 5, trend: 'stable' },
          { name: 'Cerveza', daysLeft: 7, trend: 'up' },
     ];

     return (
          <Card className="neumorphic border-0 bg-gradient-to-br from-background to-muted/20">
               <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-sm md:text-base font-bold">Proyecciones</CardTitle>
                    <CardDescription className="text-xs">
                         Próximos agotamientos
                    </CardDescription>
               </CardHeader>
               <CardContent className="px-4 pb-4">
                    {/* Mini neon chart */}
                    <div className="relative h-24 mb-3">
                         <svg width="100%" height="100%" viewBox="0 0 200 80" preserveAspectRatio="none">
                              {/* Grid lines */}
                              {[0, 1, 2, 3].map((i) => (
                                   <line
                                        key={i}
                                        x1="0"
                                        y1={i * 20}
                                        x2="200"
                                        y2={i * 20}
                                        stroke="currentColor"
                                        strokeWidth="0.5"
                                        className="text-muted-foreground/20"
                                   />
                              ))}

                              {/* Neon line */}
                              <polyline
                                   points="0,60 40,45 80,50 120,30 160,35 200,20"
                                   fill="none"
                                   stroke="url(#projectionGradient)"
                                   strokeWidth="2"
                                   strokeLinecap="round"
                                   strokeLinejoin="round"
                                   style={{
                                        filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.8))'
                                   }}
                              />

                              {/* Area fill */}
                              <polygon
                                   points="0,80 0,60 40,45 80,50 120,30 160,35 200,20 200,80"
                                   fill="url(#projectionAreaGradient)"
                                   opacity="0.3"
                              />

                              <defs>
                                   <linearGradient id="projectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#22c55e" />
                                        <stop offset="100%" stopColor="#10b981" />
                                   </linearGradient>
                                   <linearGradient id="projectionAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                                   </linearGradient>
                              </defs>
                         </svg>
                    </div>

                    {/* Projections list */}
                    <div className="space-y-2">
                         {projections.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                   <span className="text-foreground">{item.name}</span>
                                   <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">{item.daysLeft}d</span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.trend === 'down' ? 'bg-red-500' :
                                             item.trend === 'stable' ? 'bg-amber-500' :
                                                  'bg-green-500'
                                             }`} style={{
                                                  boxShadow: item.trend === 'down' ? '0 0 4px rgba(239, 68, 68, 0.8)' :
                                                       item.trend === 'stable' ? '0 0 4px rgba(245, 158, 11, 0.8)' :
                                                            '0 0 4px rgba(34, 197, 94, 0.8)'
                                             }} />
                                   </div>
                              </div>
                         ))}
                    </div>
               </CardContent>
          </Card>
     );
}
