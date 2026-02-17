"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
     Dialog,
     DialogContent,
     DialogDescription,
     DialogHeader,
     DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Building2, TrendingUp } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface UpgradePlanButtonProps {
     currentPlan?: string;
     className?: string;
}

export function UpgradePlanButton({ currentPlan = "bar_monthly", className }: UpgradePlanButtonProps) {
     const [open, setOpen] = useState(false);
     const [loading, setLoading] = useState(false);

     const handleUpgrade = async () => {
          try {
               setLoading(true);
               const supabase = createClient();

               // Get current user
               const { data: { user } } = await supabase.auth.getUser();
               if (!user) {
                    toast.error("Debes iniciar sesión");
                    return;
               }

               // Get establishment
               const { data: establishment } = await supabase
                    .from("establishments")
                    .select("*")
                    .eq("user_id", user.id)
                    .single();

               if (!establishment) {
                    toast.error("No se encontró el establecimiento");
                    return;
               }

               // Create checkout session
               const response = await fetch("/api/create-checkout-session", {
                    method: "POST",
                    headers: {
                         "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                         priceId: process.env.NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID,
                         userId: user.id,
                         userEmail: user.email,
                         establishmentId: establishment.id,
                    }),
               });

               const { sessionId, error } = await response.json();

               if (error) {
                    toast.error(error);
                    return;
               }

               // Redirect to Stripe Checkout
               const stripe = await stripePromise;
               if (!stripe) {
                    toast.error("Error al cargar Stripe");
                    return;
               }

               await stripe.redirectToCheckout({
                    sessionId,
               });
          } catch (error: any) {
               console.error("Error upgrading:", error);
               toast.error("Error al procesar el upgrade");
          } finally {
               setLoading(false);
          }
     };

     return (
          <>
               <Button
                    onClick={() => setOpen(true)}
                    className={className}
                    variant="outline"
                    size="sm"
               >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade a Cadena
               </Button>

               <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                         <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-2xl">
                                   <Sparkles className="h-6 w-6 text-primary" />
                                   Upgrade a Plan Cadena
                              </DialogTitle>
                              <DialogDescription>
                                   Desbloquea el poder de gestionar múltiples sucursales
                              </DialogDescription>
                         </DialogHeader>

                         <div className="space-y-6 py-4">
                              {/* Current vs New Plan */}
                              <div className="grid grid-cols-2 gap-4">
                                   {/* Current Plan */}
                                   <div className="border rounded-lg p-4 bg-muted/50">
                                        <div className="text-sm text-muted-foreground mb-2">Plan Actual</div>
                                        <div className="font-semibold mb-1">Bar Sucursal</div>
                                        <div className="text-2xl font-bold text-muted-foreground">
                                             $899<span className="text-sm font-normal">/mes</span>
                                        </div>
                                        <Badge variant="secondary" className="mt-2">1 Sucursal</Badge>
                                   </div>

                                   {/* New Plan */}
                                   <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-lg">
                                             Recomendado
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-2">Nuevo Plan</div>
                                        <div className="font-semibold mb-1">Cadena</div>
                                        <div className="text-2xl font-bold text-primary">
                                             $2,999<span className="text-sm font-normal">/mes</span>
                                        </div>
                                        <Badge className="mt-2">Hasta 5 Sucursales</Badge>
                                   </div>
                              </div>

                              {/* Features */}
                              <div className="space-y-3">
                                   <h4 className="font-semibold flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        Lo que obtienes con Plan Cadena:
                                   </h4>

                                   <div className="space-y-2">
                                        <div className="flex items-start gap-3">
                                             <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                             <div>
                                                  <div className="font-medium">Hasta 5 Sucursales</div>
                                                  <div className="text-sm text-muted-foreground">
                                                       Gestiona múltiples ubicaciones desde una sola cuenta
                                                  </div>
                                             </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                             <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                             <div>
                                                  <div className="font-medium">Dashboard Consolidado</div>
                                                  <div className="text-sm text-muted-foreground">
                                                       Ve métricas y reportes de todas tus sucursales en un solo lugar
                                                  </div>
                                             </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                             <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                             <div>
                                                  <div className="font-medium">Gestión Centralizada de Inventario</div>
                                                  <div className="text-sm text-muted-foreground">
                                                       Controla el stock de todas tus sucursales desde un solo panel
                                                  </div>
                                             </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                             <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                             <div>
                                                  <div className="font-medium">Reportes Comparativos</div>
                                                  <div className="text-sm text-muted-foreground">
                                                       Compara el rendimiento entre sucursales y optimiza operaciones
                                                  </div>
                                             </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                             <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                             <div>
                                                  <div className="font-medium">Soporte Prioritario</div>
                                                  <div className="text-sm text-muted-foreground">
                                                       Atención preferencial y asistencia dedicada
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              </div>

                              {/* Pricing Info */}
                              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                   <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Precio por sucursal:</span>
                                        <span className="font-medium">$599.80/mes</span>
                                   </div>
                                   <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Ahorro vs. plan individual:</span>
                                        <span className="font-medium text-green-600">$1,496/mes (33%)</span>
                                   </div>
                                   <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between">
                                             <span className="font-semibold">Total mensual:</span>
                                             <span className="text-xl font-bold text-primary">$2,999 MXN</span>
                                        </div>
                                   </div>
                              </div>

                              {/* CTA */}
                              <div className="flex gap-3">
                                   <Button
                                        onClick={handleUpgrade}
                                        disabled={loading}
                                        className="flex-1"
                                        size="lg"
                                   >
                                        {loading ? (
                                             <>
                                                  <span className="animate-spin mr-2">⏳</span>
                                                  Procesando...
                                             </>
                                        ) : (
                                             <>
                                                  <Building2 className="h-5 w-5 mr-2" />
                                                  Upgrade Ahora
                                             </>
                                        )}
                                   </Button>
                                   <Button
                                        onClick={() => setOpen(false)}
                                        variant="outline"
                                        size="lg"
                                   >
                                        Cancelar
                                   </Button>
                              </div>

                              <p className="text-xs text-center text-muted-foreground">
                                   Al hacer upgrade, se te cobrará $2,999 MXN/mes. Puedes cancelar en cualquier momento.
                              </p>
                         </div>
                    </DialogContent>
               </Dialog>
          </>
     );
}
