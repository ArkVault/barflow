"use client";

import { useSubscription } from "@/hooks/use-subscription";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, Sparkles, Crown } from "lucide-react";
import Link from "next/link";

export function TrialExpiredOverlay() {
     const { subscription, loading } = useSubscription();
     const { language } = useLanguage();

     // Don't show if loading, if active, or if dev account
     if (loading || subscription.isActive || subscription.isDevAccount) {
          return null;
     }

     // Only show when trial has ended
     if (!subscription.trialEnded) {
          return null;
     }

     return (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="max-w-lg w-full neumorphic rounded-2xl p-8 text-center space-y-6 animate-in zoom-in-95 fade-in duration-500">
                    {/* Icon */}
                    <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center ring-2 ring-amber-500/30">
                         <AlertTriangle className="h-10 w-10 text-amber-500" />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                         <h2 className="text-2xl font-bold">
                              {language === 'es' ? 'Tu período de prueba ha terminado' : 'Your trial period has ended'}
                         </h2>
                         <p className="text-muted-foreground">
                              {language === 'es'
                                   ? 'Para continuar usando Flowstock, elige un plan que se adapte a tus necesidades.'
                                   : 'To continue using Flowstock, choose a plan that fits your needs.'}
                         </p>
                    </div>

                    {/* Features reminder */}
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-left">
                         <p className="text-sm font-medium text-center mb-3">
                              {language === 'es' ? '¿Qué incluye tu suscripción?' : 'What does your subscription include?'}
                         </p>
                         <div className="grid grid-cols-2 gap-2 text-sm">
                              {[
                                   language === 'es' ? "Inventario ilimitado" : "Unlimited inventory",
                                   language === 'es' ? "Proyecciones con IA" : "AI projections",
                                   language === 'es' ? "Gestión de ventas" : "Sales management",
                                   language === 'es' ? "Importación rápida" : "Fast import",
                              ].map((feature, i) => (
                                   <div key={i} className="flex items-center gap-2">
                                        <Sparkles className="h-3 w-3 text-primary" />
                                        <span className="text-muted-foreground">{feature}</span>
                                   </div>
                              ))}
                         </div>
                    </div>

                    {/* CTA */}
                    <div className="space-y-3">
                         <Link href="/dashboard/cuenta">
                              <Button
                                   className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-lg py-6"
                                   size="lg"
                              >
                                   <Crown className="mr-2 h-5 w-5" />
                                   {language === 'es' ? 'Ver Planes y Precios' : 'View Plans & Pricing'}
                              </Button>
                         </Link>
                         <p className="text-xs text-muted-foreground">
                              {language === 'es'
                                   ? 'Planes desde $1,999 MXN/mes'
                                   : 'Plans starting at $1,999 MXN/month'}
                         </p>
                    </div>
               </div>
          </div>
     );
}
