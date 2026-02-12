"use client";

import Link from "next/link";

interface PageHeaderProps {
     title: string;
     description?: string;
     children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
     return (
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
               <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-6">
                              {/* Logo PNG que cambia según el tema */}
                              <Link href="/dashboard" className="shrink-0">
                                   <img
                                        src="/modoclaro.png"
                                        alt="Flowstock"
                                        className="h-8 dark:hidden object-contain"
                                   />
                                   <img
                                        src="/modoclaro.png"
                                        alt="Flowstock"
                                        className="h-8 hidden dark:block object-contain dark:invert"
                                   />
                              </Link>

                              {/* Title and Description */}
                              <div>
                                   <h1 className="text-2xl font-bold">{title}</h1>
                                   {description && (
                                        <p className="text-sm text-muted-foreground">{description}</p>
                                   )}
                              </div>
                         </div>

                         {/* Optional actions */}
                         {children && (
                              <div className="flex items-center gap-2">
                                   {children}
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
}
