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

     // Calculate stroke dash arrays for donut segments
     const radius = 50; // Increased from 40
     const circumference = 2 * Math.PI * radius;

     const criticalDash = (criticalPercent / 100) * circumference;
     const lowDash = (lowPercent / 100) * circumference;
     const optimalDash = (optimalPercent / 100) * circumference;

     return (
          <div className="relative w-full h-40 flex items-center justify-center">
               <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                         cx="80"
                         cy="80"
                         r={radius}
                         fill="none"
                         stroke="rgba(255,255,255,0.05)"
                         strokeWidth="16"
                    />

                    {/* Critical segment (red) with gradient */}
                    {criticalPercent > 0 && (
                         <circle
                              cx="80"
                              cy="80"
                              r={radius}
                              fill="none"
                              stroke="url(#criticalGradient)"
                              strokeWidth="16"
                              strokeDasharray={`${criticalDash} ${circumference}`}
                              strokeLinecap="round"
                              style={{
                                   filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.6))'
                              }}
                         />
                    )}

                    {/* Low segment (amber) with gradient */}
                    {lowPercent > 0 && (
                         <circle
                              cx="80"
                              cy="80"
                              r={radius}
                              fill="none"
                              stroke="url(#lowGradient)"
                              strokeWidth="16"
                              strokeDasharray={`${lowDash} ${circumference}`}
                              strokeDashoffset={-criticalDash}
                              strokeLinecap="round"
                              style={{
                                   filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))'
                              }}
                         />
                    )}

                    {/* Optimal segment (green) with gradient */}
                    {optimalPercent > 0 && (
                         <circle
                              cx="80"
                              cy="80"
                              r={radius}
                              fill="none"
                              stroke="url(#optimalGradient)"
                              strokeWidth="16"
                              strokeDasharray={`${optimalDash} ${circumference}`}
                              strokeDashoffset={-(criticalDash + lowDash)}
                              strokeLinecap="round"
                              style={{
                                   filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.6))'
                              }}
                         />
                    )}

                    {/* Gradients with subtle depth */}
                    <defs>
                         <linearGradient id="criticalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#f87171" />
                              <stop offset="50%" stopColor="#ef4444" />
                              <stop offset="100%" stopColor="#dc2626" />
                         </linearGradient>
                         <linearGradient id="lowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#fbbf24" />
                              <stop offset="50%" stopColor="#f59e0b" />
                              <stop offset="100%" stopColor="#d97706" />
                         </linearGradient>
                         <linearGradient id="optimalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#4ade80" />
                              <stop offset="50%" stopColor="#22c55e" />
                              <stop offset="100%" stopColor="#16a34a" />
                         </linearGradient>
                    </defs>
               </svg>

               {/* Center text with total and percentages */}
               <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                         <p className="text-3xl font-black mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>{total}</p>
                         <p className="text-[10px] text-muted-foreground">Insumos</p>

                         {/* Show percentages if there are items */}
                         {total > 0 && (
                              <div className="mt-2 space-y-0.5">
                                   {criticalPercent > 0 && (
                                        <p className="text-[9px] text-red-500 font-bold">{criticalPercent.toFixed(0)}%</p>
                                   )}
                                   {lowPercent > 0 && (
                                        <p className="text-[9px] text-amber-500 font-bold">{lowPercent.toFixed(0)}%</p>
                                   )}
                                   {optimalPercent > 0 && (
                                        <p className="text-[9px] text-green-500 font-bold">{optimalPercent.toFixed(0)}%</p>
                                   )}
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
}
