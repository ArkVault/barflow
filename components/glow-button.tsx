"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
     children: React.ReactNode;
}

export function GlowButton({ children, className, onClick, ...props }: GlowButtonProps) {
     return (
          <div className="relative group inline-block z-0">
               {/* 1. Colorful Glow Effect (Behind) - Made larger and moved definitively behind */}
               <div
                    className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full blur-lg opacity-0 group-hover:opacity-75 transition duration-500 group-hover:duration-200 -z-10"
               />

               {/* 2. Container for the rotating border */}
               <div className="relative p-[1.5px] rounded-full overflow-hidden bg-white/10 dark:bg-slate-800/50 backdrop-blur-sm">
                    {/* Rotating Gradient Border */}
                    <div className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#f1f5f9_0%,#94a3b8_50%,#f1f5f9_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#1e293b_0%,#ffffff_50%,#1e293b_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Actual Button Content - Restored Neumorphic Styles */}
                    <button
                         onClick={onClick}
                         className={cn(
                              "relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-full w-full",
                              // Gradient background
                              "bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-950",
                              // Inner shadow for depth
                              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]",
                              // Hover state gradient shift
                              "hover:from-white hover:to-slate-200 dark:hover:from-slate-800 dark:hover:to-slate-900",

                              "text-sm font-medium text-slate-600 dark:text-slate-300",
                              "group-hover:text-slate-900 dark:group-hover:text-white",
                              "transition-all duration-200",
                              className
                         )}
                         {...props}
                    >
                         {children}
                    </button>
               </div>
          </div>
     );
}
