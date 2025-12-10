"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/hooks/use-subscription";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
     CreditCard,
     User,
     Crown,
     CheckCircle,
     Clock,
     Edit2,
     Save,
     Sparkles,
} from "lucide-react";
import { GlowButton } from "./glow-button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface UserProfile {
     email: string;
     full_name: string;
     establishment_name: string;
     phone: string;
}

export default function AccountContent() {
     const { user, establishmentId } = useAuth();
     const { subscription } = useSubscription();
     const [profile, setProfile] = useState<UserProfile>({
          email: "",
          full_name: "",
          establishment_name: "",
          phone: "",
     });
     const [isEditing, setIsEditing] = useState(false);
     const [isSaving, setIsSaving] = useState(false);
     const [isUpgrading, setIsUpgrading] = useState(false);
     const [activeTab, setActiveTab] = useState<"profile" | "subscription">("profile");
     const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);

     useEffect(() => {
          if (user && establishmentId) {
               fetchProfile();
          }
     }, [user, establishmentId]);

     const fetchProfile = async () => {
          const supabase = createClient();
          const { data: establishment } = await supabase
               .from("establishments")
               .select("name, phone")
               .eq("id", establishmentId)
               .single();

          const { data: { user: authUser } } = await supabase.auth.getUser();

          setProfile({
               email: authUser?.email || "",
               full_name: authUser?.user_metadata?.full_name || "",
               establishment_name: establishment?.name || "",
               phone: establishment?.phone || "",
          });
     };

     const handleSaveProfile = async () => {
          setIsSaving(true);
          try {
               const supabase = createClient();
               const { error: estError } = await supabase
                    .from("establishments")
                    .update({
                         name: profile.establishment_name,
                         phone: profile.phone,
                    })
                    .eq("id", establishmentId);

               if (estError) throw estError;

               const { error: userError } = await supabase.auth.updateUser({
                    data: { full_name: profile.full_name },
               });

               if (userError) throw userError;
               toast.success("Perfil actualizado correctamente");
               setIsEditing(false);
          } catch (error) {
               console.error("Error updating profile:", error);
               toast.error("Error al actualizar el perfil");
          } finally {
               setIsSaving(false);
          }
     };

     const handleUpgrade = async (priceId: string) => {
          setIsUpgrading(true);
          try {
               const response = await fetch("/api/create-checkout-session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                         priceId,
                         establishmentId,
                         successUrl: `${window.location.origin}/dashboard/cuenta?success=true`,
                         cancelUrl: `${window.location.origin}/dashboard/cuenta?canceled=true`,
                    }),
               });

               const { sessionId, error } = await response.json();
               if (error) {
                    toast.error(error);
                    return;
               }

               const stripe = await stripePromise;
               if (!stripe) {
                    toast.error("Error al cargar Stripe");
                    return;
               }

               (stripe as any).redirectToCheckout({ sessionId });
          } catch (error) {
               console.error("Error creating checkout session:", error);
               toast.error("Error al procesar el upgrade");
          } finally {
               setIsUpgrading(false);
          }
     };


     const getPlanName = () => {
          switch (subscription.planType) {
               case "chain": return "Plan Cadena";
               case "bar_yearly": return "Bar Sucursal (Anual)";
               case "bar_monthly": return "Bar Sucursal (Mensual)";
               default: return "Trial Gratuito";
          }
     };

     const plans = [
          {
               id: "bar_monthly",
               name: "Bar Sucursal",
               price: "$899",
               period: "/mes",
               description: "Perfecto para un solo establecimiento",
               features: ["1 sucursal", "Inventario ilimitado", "Proyecciones con IA"],
               priceId: process.env.NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID!,
          },
          {
               id: "bar_yearly",
               name: "Bar Anual",
               price: "$700",
               period: "/mes",
               description: "Ahorra $2,388 al año",
               features: ["1 sucursal", "Inventario ilimitado", "2 meses gratis"],
               priceId: process.env.NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID!,
               popular: true,
          },
          {
               id: "chain",
               name: "Cadena",
               price: "$2,999",
               period: "/mes",
               description: "Para múltiples ubicaciones",
               features: ["Hasta 5 sucursales", "Dashboard consolidado", "Soporte 24/7"],
               priceId: process.env.NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID!,
          },
     ];

     const isUpgrade = (planId: string) => {
          if (subscription.planType === "chain") return false;
          if (subscription.planType === "bar_yearly" && planId === "chain") return true;
          if (subscription.planType === "bar_monthly") return planId === "bar_yearly" || planId === "chain";
          if (subscription.isTrialing || !subscription.planType) return true;
          return false;
     };

     const currentPlanIsTopTier = subscription.planType === "chain";

     return (
          <div className="max-w-5xl mx-auto p-6 space-y-8">
               {/* Header */}
               <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Mi Cuenta</h1>
                    <p className="text-muted-foreground">
                         Administra tu perfil y suscripción
                    </p>
               </div>

               {/* Tabs */}
               <div className="flex gap-6 border-b border-border">
                    <button
                         onClick={() => setActiveTab("profile")}
                         className={`relative pb-4 text-sm font-medium transition-colors ${activeTab === "profile" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                              }`}
                    >
                         Datos de perfil
                         {activeTab === "profile" && (
                              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                         )}
                    </button>
                    <button
                         onClick={() => setActiveTab("subscription")}
                         className={`relative pb-4 text-sm font-medium transition-colors ${activeTab === "subscription" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                              }`}
                    >
                         Suscripción
                         {activeTab === "subscription" && (
                              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
                         )}
                    </button>
               </div>

               {/* Content */}
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Profile Tab */}
                    {activeTab === "profile" && (
                         <div className="space-y-8">
                              <div className="neumorphic rounded-2xl p-8 space-y-6">
                                   <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                             <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                  Nombre completo
                                             </Label>
                                             {isEditing ? (
                                                  <Input
                                                       value={profile.full_name}
                                                       onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                       className="text-lg"
                                                  />
                                             ) : (
                                                  <p className="text-lg font-light">{profile.full_name || "—"}</p>
                                             )}
                                        </div>

                                        <div className="space-y-2">
                                             <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                  Email
                                             </Label>
                                             <p className="text-lg font-light">{profile.email}</p>
                                        </div>

                                        <div className="space-y-2">
                                             <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                  Teléfono
                                             </Label>
                                             {isEditing ? (
                                                  <Input
                                                       value={profile.phone}
                                                       onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                       className="text-lg"
                                                  />
                                             ) : (
                                                  <p className="text-lg font-light">{profile.phone || "—"}</p>
                                             )}
                                        </div>

                                        <div className="space-y-2">
                                             <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                  Establecimiento
                                             </Label>
                                             {isEditing ? (
                                                  <Input
                                                       value={profile.establishment_name}
                                                       onChange={(e) => setProfile({ ...profile, establishment_name: e.target.value })}
                                                       className="text-lg"
                                                  />
                                             ) : (
                                                  <p className="text-lg font-light">{profile.establishment_name || "—"}</p>
                                             )}
                                        </div>
                                   </div>

                                   <div className="flex items-center justify-end pt-6 mt-2 border-t border-border">
                                        {!isEditing ? (
                                             <Button
                                                  variant="outline"
                                                  onClick={() => setIsEditing(true)}
                                             >
                                                  <Edit2 className="mr-2 h-4 w-4" />
                                                  Editar perfil
                                             </Button>
                                        ) : (
                                             <div className="flex gap-3">
                                                  <Button
                                                       variant="ghost"
                                                       onClick={() => setIsEditing(false)}
                                                  >
                                                       Cancelar
                                                  </Button>
                                                  <Button
                                                       onClick={handleSaveProfile}
                                                       disabled={isSaving}
                                                  >
                                                       {isSaving ? (
                                                            <span className="flex items-center gap-2">
                                                                 <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                                                 Guardando...
                                                            </span>
                                                       ) : (
                                                            <>
                                                                 <Save className="mr-2 h-4 w-4" />
                                                                 Guardar cambios
                                                            </>
                                                       )}
                                                  </Button>
                                             </div>
                                        )}
                                   </div>
                              </div>
                         </div>
                    )}

                    {/* Subscription Tab */}
                    {activeTab === "subscription" && (
                         <div className="space-y-8">
                              {/* Current Plan Card */}
                              <div className="neumorphic rounded-2xl p-8">
                                   <div className="flex items-start justify-between">
                                        <div>
                                             <p className="text-sm font-medium text-muted-foreground mb-1">Plan Actual</p>
                                             <h3 className="text-3xl font-semibold tracking-tight">
                                                  {getPlanName()}
                                             </h3>
                                             {subscription.isTrialing && (
                                                  <div className="mt-3 inline-flex items-center rounded-full bg-yellow-500/10 px-3 py-1.5 text-sm font-medium text-yellow-600 dark:text-yellow-500 ring-1 ring-inset ring-yellow-500/20">
                                                       <Clock className="mr-1.5 h-4 w-4" />
                                                       {subscription.daysRemaining} días restantes de prueba
                                                  </div>
                                             )}
                                        </div>
                                        <div className="rounded-full bg-green-500/10 p-3 ring-1 ring-green-500/20">
                                             <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-500" />
                                        </div>
                                   </div>

                                   {!currentPlanIsTopTier && !showUpgradeOptions && (
                                        <div className="mt-8">
                                             <GlowButton
                                                  onClick={() => setShowUpgradeOptions(true)}
                                                  className="w-full"
                                             >
                                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-inner">
                                                       <Sparkles className="w-3.5 h-3.5 text-white" />
                                                  </div>
                                                  <span>Mejorar mi plan</span>
                                             </GlowButton>
                                        </div>
                                   )}
                              </div>

                              {/* Upgrade Options */}
                              {(showUpgradeOptions || subscription.isTrialing) && !currentPlanIsTopTier && (
                                   <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                             <h4 className="text-lg font-semibold">Planes disponibles</h4>
                                             {showUpgradeOptions && !subscription.isTrialing && (
                                                  <button
                                                       onClick={() => setShowUpgradeOptions(false)}
                                                       className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                  >
                                                       Ocultar planes
                                                  </button>
                                             )}
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                             {plans.map((plan) => {
                                                  if (!isUpgrade(plan.id)) return null;

                                                  return (
                                                       <div
                                                            key={plan.id}
                                                            className="neumorphic rounded-2xl p-6 space-y-6 hover:scale-[1.02] transition-transform"
                                                       >
                                                            {plan.popular && (
                                                                 <div className="inline-flex rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold text-black uppercase tracking-wider">
                                                                      Popular
                                                                 </div>
                                                            )}

                                                            <div className="space-y-2">
                                                                 <h5 className="text-xl font-semibold">{plan.name}</h5>
                                                                 <p className="text-sm text-muted-foreground">{plan.description}</p>
                                                                 <div className="flex items-baseline gap-1">
                                                                      <span className="text-3xl font-bold">{plan.price}</span>
                                                                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                                                                 </div>
                                                            </div>

                                                            <ul className="space-y-2">
                                                                 {plan.features.map((feature, i) => (
                                                                      <li key={i} className="flex items-center gap-2 text-sm">
                                                                           <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                                           {feature}
                                                                      </li>
                                                                 ))}
                                                            </ul>

                                                            <Button
                                                                 onClick={() => handleUpgrade(plan.priceId)}
                                                                 disabled={isUpgrading}
                                                                 className="w-full"
                                                            >
                                                                 {isUpgrading ? (
                                                                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                                                 ) : (
                                                                      "Mejorar Plan"
                                                                 )}
                                                            </Button>
                                                       </div>
                                                  );
                                             })}
                                        </div>
                                   </div>
                              )}

                              {currentPlanIsTopTier && (
                                   <div className="neumorphic rounded-2xl p-8 text-center space-y-3">
                                        <Crown className="mx-auto h-12 w-12 text-yellow-500" />
                                        <h4 className="text-xl font-semibold">¡Estás en el nivel máximo!</h4>
                                        <p className="text-muted-foreground">
                                             Tienes acceso a todas las funcionalidades exclusivas de BarFlow.
                                        </p>
                                   </div>
                              )}
                         </div>
                    )}
               </div>
          </div>
     );
}
