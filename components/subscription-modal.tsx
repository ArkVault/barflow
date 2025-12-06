"use client";

import { useState } from "react";
import {
     Dialog,
     DialogContent,
     DialogDescription,
     DialogHeader,
     DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { getStripe } from "@/lib/stripe/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

interface SubscriptionModalProps {
     open: boolean;
     onOpenChange: (open: boolean) => void;
     trialEnded?: boolean;
}

export function SubscriptionModal({
     open,
     onOpenChange,
     trialEnded = false,
}: SubscriptionModalProps) {
     const [loading, setLoading] = useState<string | null>(null);
     const { user } = useAuth();

     const handleSubscribe = async (priceId: string, planName: string) => {
          if (!user) {
               toast.error("Debes iniciar sesión para suscribirte");
               return;
          }

          setLoading(planName);

          try {
               // Create checkout session
               const response = await fetch("/api/stripe/create-checkout-session", {
                    method: "POST",
                    headers: {
                         "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                         priceId,
                         userId: user.id,
                    }),
               });

               const { sessionId, url, error } = await response.json();

               if (error) {
                    throw new Error(error);
               }

               // Redirect to Stripe Checkout
               if (url) {
                    window.location.href = url;
               } else if (sessionId) {
                    // Fallback: construct URL manually
                    window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
               }
          } catch (error: any) {
               console.error("Error creating checkout session:", error);
               toast.error("Error al procesar la suscripción. Intenta de nuevo.");
               setLoading(null);
          }
     };

     const plans = [
          {
               name: "bar-monthly",
               title: "Bar Sucursal",
               subtitle: "Mensual",
               price: "$899",
               period: "/mes",
               perUser: "por usuario",
               priceId: process.env.NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID!,
               icon: Zap,
               color: "from-blue-500 to-cyan-500",
               features: [
                    "Gestión completa de inventario",
                    "Análisis de ventas en tiempo real",
                    "Proyecciones con IA",
                    "Gestión de menús ilimitados",
                    "1 sucursal",
                    "Soporte prioritario",
               ],
          },
          {
               name: "bar-yearly",
               title: "Bar Sucursal",
               subtitle: "Anual",
               price: "$700",
               period: "/mes",
               perUser: "por usuario",
               originalPrice: "$899",
               priceId: process.env.NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID!,
               icon: Sparkles,
               color: "from-purple-500 to-pink-500",
               badge: "Ahorra $199/mes",
               features: [
                    "Todo lo del plan mensual",
                    "Ahorro de $2,388 al año",
                    "Facturación anual",
                    "Consultoría personalizada",
                    "Reportes avanzados",
                    "Soporte 24/7 prioritario",
               ],
          },
          {
               name: "chain",
               title: "Cadena",
               subtitle: "Multi-sucursal",
               price: "$2,999",
               period: "/mes",
               perUser: "por usuario",
               perBranches: "hasta 5 sucursales",
               priceId: process.env.NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID!,
               icon: Crown,
               color: "from-orange-500 to-red-500",
               badge: "Mejor para cadenas",
               popular: true,
               features: [
                    "Hasta 5 sucursales incluidas",
                    "Gestión centralizada",
                    "Dashboard consolidado",
                    "Análisis comparativo entre sucursales",
                    "API de integración",
                    "Gestor de cuenta dedicado",
                    "Soporte 24/7 premium",
                    "Capacitación personalizada",
               ],
          },
     ];

     return (
          <Dialog open={open} onOpenChange={onOpenChange}>
               <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                         <div className="flex items-center justify-center mb-4">
                              <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-500/20">
                                   <Sparkles className="w-8 h-8 text-purple-500" />
                              </div>
                         </div>
                         <DialogTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                              {trialEnded
                                   ? "Tu período de prueba ha terminado"
                                   : "Desbloquea todo el potencial de Barmode"}
                         </DialogTitle>
                         <DialogDescription className="text-center text-base mt-2">
                              {trialEnded
                                   ? "Suscríbete ahora para continuar optimizando la operación de tu bar"
                                   : "Elige el plan que mejor se adapte a tu negocio"}
                         </DialogDescription>
                    </DialogHeader>

                    <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mt-6">
                         {plans.map((plan) => {
                              const Icon = plan.icon;
                              return (
                                   <div
                                        key={plan.name}
                                        className="relative group"
                                   >
                                        {/* Glow effect */}
                                        <div className={`absolute -inset-0.5 bg-gradient-to-r ${plan.color} rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500`} />

                                        {/* Card */}
                                        <div className={`relative bg-card border rounded-2xl p-6 h-full flex flex-col ${plan.popular ? 'border-2 border-orange-500' : ''}`}>
                                             {plan.badge && (
                                                  <div className="absolute -top-3 right-6">
                                                       <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${plan.color}`}>
                                                            <Sparkles className="w-3 h-3" />
                                                            {plan.badge}
                                                       </span>
                                                  </div>
                                             )}

                                             <div className="flex items-center gap-3 mb-2">
                                                  <div className={`p-2 rounded-lg bg-gradient-to-br ${plan.color} bg-opacity-10`}>
                                                       <Icon className="w-6 h-6" />
                                                  </div>
                                                  <div>
                                                       <h3 className="text-xl font-bold">{plan.title}</h3>
                                                       {plan.subtitle && (
                                                            <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
                                                       )}
                                                  </div>
                                             </div>

                                             <div className="mb-6">
                                                  <div className="flex items-baseline gap-2">
                                                       <span className="text-4xl font-bold">{plan.price}</span>
                                                       <div className="flex flex-col">
                                                            <span className="text-muted-foreground text-sm">{plan.period}</span>
                                                            {plan.perUser && (
                                                                 <span className="text-xs text-muted-foreground">{plan.perUser}</span>
                                                            )}
                                                       </div>
                                                  </div>
                                                  {plan.originalPrice && (
                                                       <p className="text-sm text-muted-foreground mt-1">
                                                            <span className="line-through">{plan.originalPrice}/mes</span>
                                                            {' '}<span className="text-green-600 font-semibold">Ahorra ${(899 - 700) * 12}/año</span>
                                                       </p>
                                                  )}
                                                  {plan.perBranches && (
                                                       <p className="text-sm font-semibold text-orange-600 mt-1">
                                                            {plan.perBranches}
                                                       </p>
                                                  )}
                                                  <p className="text-xs text-muted-foreground mt-1">
                                                       MXN + IVA
                                                  </p>
                                             </div>

                                             <ul className="space-y-3 mb-6 flex-grow">
                                                  {plan.features.map((feature, index) => (
                                                       <li key={index} className="flex items-start gap-2">
                                                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                            <span className="text-sm">{feature}</span>
                                                       </li>
                                                  ))}
                                             </ul>

                                             <Button
                                                  onClick={() => handleSubscribe(plan.priceId, plan.name)}
                                                  disabled={loading !== null}
                                                  className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-semibold h-12 shadow-lg transition-all duration-300`}
                                             >
                                                  {loading === plan.name ? (
                                                       <span className="flex items-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            Procesando...
                                                       </span>
                                                  ) : (
                                                       "Suscribirse ahora"
                                                  )}
                                             </Button>
                                        </div>
                                   </div>
                              );
                         })}
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                         <p className="text-sm text-center text-muted-foreground">
                              🔒 Pago seguro procesado por Stripe • Cancela en cualquier momento • Sin compromisos a largo plazo
                         </p>
                    </div>
               </DialogContent>
          </Dialog>
     );
}
