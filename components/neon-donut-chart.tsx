"use client";

interface NeonDonutChartProps {
     critical: number;
     low: number;
     optimal: number;
}

export function NeonDonutChart({ critical, low, optimal }: NeonDonutChartProps) {
     const total = critical + low + optimal;

     // Calculate percentages
     const criticalPercent = total > 0 ? (critical / total) * 100 : 0;
     const lowPercent = total > 0 ? (low / total) * 100 : 0;
     const optimalPercent = total > 0 ? (optimal / total) * 100 : 0;

     // Half donut chart (semicircle) - COMPACT SIZE
     const radius = 65; // Reduced from 95
     const strokeWidth = 20; // Reduced from 28
     const centerX = 100; // Adjusted for compact size
     const centerY = 100; // Adjusted for compact size

     // Calculate arc lengths for half circle (180 degrees)
     const circumference = Math.PI * radius; // Half circle

     const criticalDash = (criticalPercent / 100) * circumference;
     const lowDash = (lowPercent / 100) * circumference;
     const optimalDash = (optimalPercent / 100) * circumference;

     return (
          <div className="relative w-full flex flex-col items-center">
               {/* Half Donut Chart - COMPACT */}
               <svg width="200" height="110" viewBox="0 0 200 110" className="mb-1">
                    {/* Background arc */}
                    <path
                         d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
                         fill="none"
                         stroke="rgba(255,255,255,0.05)"
                         strokeWidth={strokeWidth}
                         strokeLinecap="round"
                    />

                    {/* Critical arc (red) */}
                    {criticalPercent > 0 && (
                         <path
                              d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
                              fill="none"
                              stroke="url(#criticalHalfGradient)"
                              strokeWidth={strokeWidth}
                              strokeDasharray={`${criticalDash} ${circumference}`}
                              strokeLinecap="round"
                              style={{
                                   filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
                              }}
                         />
                    )}

                    {/* Low arc (amber) */}
                    {lowPercent > 0 && (
                         <path
                              d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
                              fill="none"
                              stroke="url(#lowHalfGradient)"
                              strokeWidth={strokeWidth}
                              strokeDasharray={`${lowDash} ${circumference}`}
                              strokeDashoffset={-criticalDash}
                              strokeLinecap="round"
                              style={{
                                   filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))'
                              }}
                         />
                    )}

                    {/* Optimal arc (green) */}
                    {optimalPercent > 0 && (
                         <path
                              d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
                              fill="none"
                              stroke="url(#optimalHalfGradient)"
                              strokeWidth={strokeWidth}
                              strokeDasharray={`${optimalDash} ${circumference}`}
                              strokeDashoffset={-(criticalDash + lowDash)}
                              strokeLinecap="round"
                              style={{
                                   filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))'
                              }}
                         />
                    )}

                    {/* Total in center */}
                    <text
                         x={centerX}
                         y={centerY - 5}
                         textAnchor="middle"
                         className="fill-foreground font-black text-2xl"
                         style={{ fontFamily: 'Satoshi, sans-serif' }}
                    >
                         {total}
                    </text>
                    <text
                         x={centerX}
                         y={centerY + 10}
                         textAnchor="middle"
                         className="fill-muted-foreground text-[9px]"
                    >
                         Insumos
                    </text>

                    {/* Gradients */}
                    <defs>
                         <linearGradient id="criticalHalfGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#f87171" />
                              <stop offset="50%" stopColor="#ef4444" />
                              <stop offset="100%" stopColor="#dc2626" />
                         </linearGradient>
                         <linearGradient id="lowHalfGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#fbbf24" />
                              <stop offset="50%" stopColor="#f59e0b" />
                              <stop offset="100%" stopColor="#d97706" />
                         </linearGradient>
                         <linearGradient id="optimalHalfGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#4ade80" />
                              <stop offset="50%" stopColor="#22c55e" />
                              <stop offset="100%" stopColor="#16a34a" />
                         </linearGradient>
                    </defs>
               </svg>

               {/* Legend with percentages */}
               <div className="w-full space-y-1">
                    {critical > 0 && (
                         <div className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5">
                                   <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-red-400 to-red-600"
                                        style={{ boxShadow: '0 0 4px rgba(239, 68, 68, 0.6)' }} />
                                   <span className="text-muted-foreground">Críticos</span>
                              </div>
                              <span className="font-bold text-red-500">{criticalPercent.toFixed(1)}%</span>
                         </div>
                    )}
                    {low > 0 && (
                         <div className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5">
                                   <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-amber-400 to-amber-600"
                                        style={{ boxShadow: '0 0 4px rgba(245, 158, 11, 0.6)' }} />
                                   <span className="text-muted-foreground">Bajos</span>
                              </div>
                              <span className="font-bold text-amber-500">{lowPercent.toFixed(1)}%</span>
                         </div>
                    )}
                    {optimal > 0 && (
                         <div className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5">
                                   <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-green-400 to-green-600"
                                        style={{ boxShadow: '0 0 4px rgba(34, 197, 94, 0.6)' }} />
                                   <span className="text-muted-foreground">Óptimos</span>
                              </div>
                              <span className="font-bold text-green-500">{optimalPercent.toFixed(1)}%</span>
                         </div>
                    )}
               </div>
          </div>
     );
}
