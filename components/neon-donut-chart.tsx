"use client";

interface NeonDonutChartProps {
     critical: number;
     low: number;
     optimal: number;
}

export function NeonDonutChart({ critical, low, optimal }: NeonDonutChartProps) {
     const total = critical + low + optimal;

     // Calculate percentages
     const criticalPercent = (critical / total) * 100;
     const lowPercent = (low / total) * 100;
     const optimalPercent = (optimal / total) * 100;

     // Calculate stroke dash arrays for donut segments
     const radius = 40;
     const circumference = 2 * Math.PI * radius;

     const criticalDash = (criticalPercent / 100) * circumference;
     const lowDash = (lowPercent / 100) * circumference;
     const optimalDash = (optimalPercent / 100) * circumference;

     return (
          <div className="relative w-full h-32 flex items-center justify-center">
               <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                         cx="60"
                         cy="60"
                         r={radius}
                         fill="none"
                         stroke="rgba(255,255,255,0.05)"
                         strokeWidth="12"
                    />

                    {/* Critical segment (red) */}
                    <circle
                         cx="60"
                         cy="60"
                         r={radius}
                         fill="none"
                         stroke="url(#criticalGradient)"
                         strokeWidth="12"
                         strokeDasharray={`${criticalDash} ${circumference}`}
                         strokeLinecap="round"
                         style={{
                              filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
                         }}
                    />

                    {/* Low segment (amber) */}
                    <circle
                         cx="60"
                         cy="60"
                         r={radius}
                         fill="none"
                         stroke="url(#lowGradient)"
                         strokeWidth="12"
                         strokeDasharray={`${lowDash} ${circumference}`}
                         strokeDashoffset={-criticalDash}
                         strokeLinecap="round"
                         style={{
                              filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))'
                         }}
                    />

                    {/* Optimal segment (green) */}
                    <circle
                         cx="60"
                         cy="60"
                         r={radius}
                         fill="none"
                         stroke="url(#optimalGradient)"
                         strokeWidth="12"
                         strokeDasharray={`${optimalDash} ${circumference}`}
                         strokeDashoffset={-(criticalDash + lowDash)}
                         strokeLinecap="round"
                         style={{
                              filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))'
                         }}
                    />

                    {/* Gradients */}
                    <defs>
                         <linearGradient id="criticalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#ef4444" />
                              <stop offset="100%" stopColor="#dc2626" />
                         </linearGradient>
                         <linearGradient id="lowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#f59e0b" />
                              <stop offset="100%" stopColor="#d97706" />
                         </linearGradient>
                         <linearGradient id="optimalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#22c55e" />
                              <stop offset="100%" stopColor="#16a34a" />
                         </linearGradient>
                    </defs>
               </svg>

               {/* Center text */}
               <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                         <p className="text-2xl font-black" style={{ fontFamily: 'Satoshi, sans-serif' }}>{total}</p>
                         <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
               </div>
          </div>
     );
}
