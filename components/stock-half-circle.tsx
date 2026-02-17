"use client";

interface StockHalfCircleProps {
     percentage: number;
     status: 'critical' | 'low' | 'ok';
}

export function StockHalfCircle({ percentage, status }: StockHalfCircleProps) {
     // Clamp percentage between 0 and 100
     const clampedPercentage = Math.max(0, Math.min(100, percentage));

     // Color based on status
     const colors = {
          critical: {
               stroke: '#ef4444',
               glow: 'rgba(239, 68, 68, 0.6)',
               gradient: ['#f87171', '#ef4444', '#dc2626']
          },
          low: {
               stroke: '#f59e0b',
               glow: 'rgba(245, 158, 11, 0.6)',
               gradient: ['#fbbf24', '#f59e0b', '#d97706']
          },
          ok: {
               stroke: '#22c55e',
               glow: 'rgba(34, 197, 94, 0.6)',
               gradient: ['#4ade80', '#22c55e', '#16a34a']
          }
     };

     const color = colors[status];

     // Calculate arc path for half circle
     const radius = 20;
     const strokeWidth = 4;
     const circumference = Math.PI * radius; // Half circle
     const dashOffset = circumference - (clampedPercentage / 100) * circumference;

     return (
          <div className="relative inline-flex items-center justify-center">
               <svg width="50" height="30" viewBox="0 0 50 30" className="overflow-visible">
                    {/* Background arc */}
                    <path
                         d="M 5 25 A 20 20 0 0 1 45 25"
                         fill="none"
                         stroke="rgba(255,255,255,0.1)"
                         strokeWidth={strokeWidth}
                         strokeLinecap="round"
                    />

                    {/* Colored arc with gradient */}
                    <path
                         d="M 5 25 A 20 20 0 0 1 45 25"
                         fill="none"
                         stroke={`url(#halfCircleGradient-${status})`}
                         strokeWidth={strokeWidth}
                         strokeLinecap="round"
                         strokeDasharray={circumference}
                         strokeDashoffset={dashOffset}
                         style={{
                              filter: `drop-shadow(0 0 4px ${color.glow})`,
                              transition: 'stroke-dashoffset 0.5s ease-in-out'
                         }}
                    />

                    {/* Gradient definition */}
                    <defs>
                         <linearGradient id={`halfCircleGradient-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor={color.gradient[0]} />
                              <stop offset="50%" stopColor={color.gradient[1]} />
                              <stop offset="100%" stopColor={color.gradient[2]} />
                         </linearGradient>
                    </defs>
               </svg>

               {/* Percentage text */}
               <div className="absolute inset-0 flex items-end justify-center pb-0.5">
                    <span
                         className="text-[10px] font-bold"
                         style={{ color: color.stroke }}
                    >
                         {clampedPercentage.toFixed(0)}%
                    </span>
               </div>
          </div>
     );
}
