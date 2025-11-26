"use client";

interface NeonDonutChartProps {
     critical: number;
     low: number;
     optimal: number;
}

export function NeonDonutChart({ critical, low, optimal }: NeonDonutChartProps) {
     const total = critical + low + optimal;

     // Calculate percentages for sizing
     const criticalPercent = total > 0 ? (critical / total) * 100 : 0;
     const lowPercent = total > 0 ? (low / total) * 100 : 0;
     const optimalPercent = total > 0 ? (optimal / total) * 100 : 0;

     // Mosaic plot dimensions
     const width = 280;
     const height = 180;
     const barHeight = 140;
     const startY = 20;

     // Calculate bar widths based on percentages
     const criticalWidth = (criticalPercent / 100) * width;
     const lowWidth = (lowPercent / 100) * width;
     const optimalWidth = (optimalPercent / 100) * width;

     return (
          <div className="relative w-full flex flex-col items-center">
               {/* Mosaic Plot */}
               <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mb-4">
                    {/* Critical bar (red) */}
                    {critical > 0 && (
                         <g>
                              <rect
                                   x="0"
                                   y={startY}
                                   width={criticalWidth}
                                   height={barHeight}
                                   fill="url(#criticalMosaicGradient)"
                                   style={{
                                        filter: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.6))'
                                   }}
                              />
                              {/* Quantity label */}
                              {criticalWidth > 30 && (
                                   <text
                                        x={criticalWidth / 2}
                                        y={startY + barHeight / 2}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-white font-black text-2xl"
                                        style={{ fontFamily: 'Satoshi, sans-serif' }}
                                   >
                                        {critical}
                                   </text>
                              )}
                         </g>
                    )}

                    {/* Low bar (amber) */}
                    {low > 0 && (
                         <g>
                              <rect
                                   x={criticalWidth}
                                   y={startY}
                                   width={lowWidth}
                                   height={barHeight}
                                   fill="url(#lowMosaicGradient)"
                                   style={{
                                        filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.6))'
                                   }}
                              />
                              {/* Quantity label */}
                              {lowWidth > 30 && (
                                   <text
                                        x={criticalWidth + lowWidth / 2}
                                        y={startY + barHeight / 2}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-white font-black text-2xl"
                                        style={{ fontFamily: 'Satoshi, sans-serif' }}
                                   >
                                        {low}
                                   </text>
                              )}
                         </g>
                    )}

                    {/* Optimal bar (green) */}
                    {optimal > 0 && (
                         <g>
                              <rect
                                   x={criticalWidth + lowWidth}
                                   y={startY}
                                   width={optimalWidth}
                                   height={barHeight}
                                   fill="url(#optimalMosaicGradient)"
                                   style={{
                                        filter: 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.6))'
                                   }}
                              />
                              {/* Quantity label */}
                              {optimalWidth > 30 && (
                                   <text
                                        x={criticalWidth + lowWidth + optimalWidth / 2}
                                        y={startY + barHeight / 2}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-white font-black text-2xl"
                                        style={{ fontFamily: 'Satoshi, sans-serif' }}
                                   >
                                        {optimal}
                                   </text>
                              )}
                         </g>
                    )}

                    {/* Gradients with neon effect */}
                    <defs>
                         <linearGradient id="criticalMosaicGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#f87171" stopOpacity="0.9" />
                              <stop offset="50%" stopColor="#ef4444" stopOpacity="1" />
                              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.9" />
                         </linearGradient>
                         <linearGradient id="lowMosaicGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
                              <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
                              <stop offset="100%" stopColor="#d97706" stopOpacity="0.9" />
                         </linearGradient>
                         <linearGradient id="optimalMosaicGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.9" />
                              <stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
                              <stop offset="100%" stopColor="#16a34a" stopOpacity="0.9" />
                         </linearGradient>
                    </defs>
               </svg>

               {/* Legend with percentages */}
               <div className="w-full space-y-1.5">
                    {critical > 0 && (
                         <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                   <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-red-400 to-red-600"
                                        style={{ boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)' }} />
                                   <span className="text-muted-foreground">Críticos</span>
                              </div>
                              <span className="font-bold text-red-500">{criticalPercent.toFixed(1)}%</span>
                         </div>
                    )}
                    {low > 0 && (
                         <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                   <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-amber-400 to-amber-600"
                                        style={{ boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)' }} />
                                   <span className="text-muted-foreground">Bajos</span>
                              </div>
                              <span className="font-bold text-amber-500">{lowPercent.toFixed(1)}%</span>
                         </div>
                    )}
                    {optimal > 0 && (
                         <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                   <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-green-400 to-green-600"
                                        style={{ boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)' }} />
                                   <span className="text-muted-foreground">Óptimos</span>
                              </div>
                              <span className="font-bold text-green-500">{optimalPercent.toFixed(1)}%</span>
                         </div>
                    )}
               </div>
          </div>
     );
}
