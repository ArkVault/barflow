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
     X,
     LogOut,
     Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

const stripePromise = loadStripe(
     process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface AccountModalProps {
     isOpen: boolean;
     onClose: () => void;
}

interface UserProfile {
     email: string;
     full_name: string;
     establishment_name: string;
     phone: string;
}

export function AccountModal({ isOpen, onClose }: AccountModalProps) {
     const router = useRouter();
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
          if (user && establishmentId && isOpen) {
               fetchProfile();
          }
     }, [user, establishmentId, isOpen]);

     useEffect(() => {
          const handleEscape = (e: KeyboardEvent) => {
               if (e.key === "Escape") onClose();
          };
          if (isOpen) {
               document.addEventListener("keydown", handleEscape);
               document.body.style.overflow = "hidden";
          }
          return () => {
               document.removeEventListener("keydown", handleEscape);
               document.body.style.overflow = "unset";
          };
     }, [isOpen, onClose]);

     if (!isOpen) return null;

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
                         successUrl: `${window.location.origin}/dashboard?success=true`,
                         cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
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

     const handleLogout = async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.push("/");
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

     // Logic to determine if a plan is an upgrade
     const isUpgrade = (planId: string) => {
          if (subscription.planType === "chain") return false; // Already top tier
          if (subscription.planType === "bar_yearly" && planId === "chain") return true;
          if (subscription.planType === "bar_monthly") return planId === "bar_yearly" || planId === "chain";
          if (subscription.isTrialing || !subscription.planType) return true; // Upgrade from trial
          return false;
     };

     const currentPlanIsTopTier = subscription.planType === "chain";

     return (
          <div
               className="fixed inset-0 flex items-start justify-center pt-20 md:pt-28 bg-black/60"
               style={{
                    zIndex: 9999999,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
               }}
               onClick={onClose}
          >
               {/* Modal Content - always on top */}
               <div
                    className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-zinc-900/90 shadow-[0_20px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/10 mx-4"
                    style={{ zIndex: 10000000 }}
                    onClick={(e) => e.stopPropagation()}
               >

                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                         <h2 className="text-xl font-medium tracking-tight text-white/90">Cuenta</h2>
                         <button
                              onClick={onClose}
                              className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                         >
                              <X className="h-5 w-5" />
                         </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/5 px-6">
                         <button
                              onClick={() => setActiveTab("profile")}
                              className={`relative mr-6 py-4 text-sm font-medium transition-colors ${activeTab === "profile" ? "text-white" : "text-white/40 hover:text-white/70"
                                   }`}
                         >
                              Datos de perfil
                              {activeTab === "profile" && (
                                   <span className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                              )}
                         </button>
                         <button
                              onClick={() => setActiveTab("subscription")}
                              className={`relative py-4 text-sm font-medium transition-colors ${activeTab === "subscription" ? "text-white" : "text-white/40 hover:text-white/70"
                                   }`}
                         >
                              Suscripción
                              {activeTab === "subscription" && (
                                   <span className="absolute bottom-0 left-0 h-0.5 w-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
                              )}
                         </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-[70vh] overflow-y-auto px-6 py-8">
                         {/* Profile Tab */}
                         {activeTab === "profile" && (
                              <div className="space-y-6">
                                   <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                             <Label className="text-xs font-medium text-white/40 uppercase tracking-wider">Nombre completo</Label>
                                             {isEditing ? (
                                                  <Input
                                                       value={profile.full_name}
                                                       onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                       className="bg-white/5 border-white/10 text-white focus:border-blue-500/50 focus:ring-blue-500/20"
                                                  />
                                             ) : (
                                                  <p className="text-lg text-white/90 font-light">{profile.full_name || "—"}</p>
                                             )}
                                        </div>

                                        <div className="space-y-2">
                                             <Label className="text-xs font-medium text-white/40 uppercase tracking-wider">Email</Label>
                                             <p className="text-lg text-white/90 font-light">{profile.email}</p>
                                        </div>

                                        <div className="space-y-2">
                                             <Label className="text-xs font-medium text-white/40 uppercase tracking-wider">Teléfono</Label>
                                             {isEditing ? (
                                                  <Input
                                                       value={profile.phone}
                                                       onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                       className="bg-white/5 border-white/10 text-white focus:border-blue-500/50 focus:ring-blue-500/20"
                                                  />
                                             ) : (
                                                  <p className="text-lg text-white/90 font-light">{profile.phone || "—"}</p>
                                             )}
                                        </div>

                                        <div className="space-y-2">
                                             <Label className="text-xs font-medium text-white/40 uppercase tracking-wider">Establecimiento</Label>
                                             {isEditing ? (
                                                  <Input
                                                       value={profile.establishment_name}
                                                       onChange={(e) => setProfile({ ...profile, establishment_name: e.target.value })}
                                                       className="bg-white/5 border-white/10 text-white focus:border-blue-500/50 focus:ring-blue-500/20"
                                                  />
                                             ) : (
                                                  <p className="text-lg text-white/90 font-light">{profile.establishment_name || "—"}</p>
                                             )}
                                        </div>
                                   </div>

                                   <div className="flex items-center justify-between pt-6 mt-2 border-t border-white/5">
                                        <Button
                                             variant="ghost"
                                             onClick={handleLogout}
                                             className="text-red-400 hover:text-red-300 hover:bg-red-500/10 -ml-2"
                                        >
                                             <LogOut className="mr-2 h-4 w-4" />
                                             Cerrar sesión
                                        </Button>

                                        {!isEditing ? (
                                             <Button
                                                  variant="outline"
                                                  onClick={() => setIsEditing(true)}
                                                  className="border-white/10 text-white hover:bg-white/5"
                                             >
                                                  <Edit2 className="mr-2 h-4 w-4" />
                                                  Editar perfil
                                             </Button>
                                        ) : (
                                             <div className="flex gap-3">
                                                  <Button
                                                       variant="ghost"
                                                       onClick={() => setIsEditing(false)}
                                                       className="text-white/60 hover:text-white"
                                                  >
                                                       Cancelar
                                                  </Button>
                                                  <Button
                                                       onClick={handleSaveProfile}
                                                       disabled={isSaving}
                                                       className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
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
                         )}

                         {/* Subscription Tab */}
                         {activeTab === "subscription" && (
                              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                   {/* Current Plan Card */}
                                   <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-6">
                                        <div className="flex items-start justify-between">
                                             <div>
                                                  <p className="text-sm font-medium text-white/40 mb-1">Plan Actual</p>
                                                  <h3 className="text-2xl font-semibold text-white tracking-tight">
                                                       {getPlanName()}
                                                  </h3>
                                                  {subscription.isTrialing && (
                                                       <div className="mt-2 inline-flex items-center rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500 ring-1 ring-inset ring-yellow-500/20">
                                                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                                                            {subscription.daysRemaining} días restantes de prueba
                                                       </div>
                                                  )}
                                             </div>
                                             <div className="rounded-full bg-green-500/10 p-2 ring-1 ring-green-500/20">
                                                  <CheckCircle className="h-6 w-6 text-green-500" />
                                             </div>
                                        </div>

                                        {!currentPlanIsTopTier && !showUpgradeOptions && (
                                             <div className="mt-8">
                                                  <Button
                                                       onClick={() => setShowUpgradeOptions(true)}
                                                       className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 shadow-[0_0_25px_rgba(124,58,237,0.3)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(124,58,237,0.5)]"
                                                  >
                                                       <Sparkles className="mr-2 h-4 w-4" />
                                                       Mejorar mi plan
                                                  </Button>
                                             </div>
                                        )}
                                   </div>

                                   {/* Upgrade Options */}
                                   {(showUpgradeOptions || subscription.isTrialing) && !currentPlanIsTopTier && (
                                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                                             <div className="flex items-center justify-between">
                                                  <h4 className="text-sm font-medium text-white/60">Disponibles para ti</h4>
                                                  {showUpgradeOptions && !subscription.isTrialing && (
                                                       <button
                                                            onClick={() => setShowUpgradeOptions(false)}
                                                            className="text-xs text-white/30 hover:text-white transition-colors"
                                                       >
                                                            Ocultar planes
                                                       </button>
                                                  )}
                                             </div>

                                             <div className="grid gap-4">
                                                  {plans.map((plan) => {
                                                       if (!isUpgrade(plan.id)) return null;

                                                       return (
                                                            <div
                                                                 key={plan.id}
                                                                 className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05] hover:border-white/10"
                                                            >
                                                                 {plan.popular && (
                                                                      <div className="absolute top-0 right-0 rounded-bl-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[10px] font-bold text-black uppercase tracking-wider">
                                                                           Popular
                                                                      </div>
                                                                 )}

                                                                 <div className="space-y-1">
                                                                      <div className="flex items-center gap-2">
                                                                           <span className="font-semibold text-white">{plan.name}</span>
                                                                      </div>
                                                                      <div className="text-sm text-white/40">{plan.description}</div>
                                                                      <div className="flex items-baseline gap-1">
                                                                           <span className="text-xl font-bold text-white">{plan.price}</span>
                                                                           <span className="text-xs text-white/40">{plan.period}</span>
                                                                      </div>
                                                                 </div>

                                                                 <Button
                                                                      onClick={() => handleUpgrade(plan.priceId)}
                                                                      disabled={isUpgrading}
                                                                      className="shrink-0 bg-white/10 hover:bg-white/20 text-white min-w-[120px]"
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
                                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
                                             <Crown className="mx-auto h-8 w-8 text-yellow-500/50 mb-3" />
                                             <h4 className="text-white font-medium">¡Estás en el nivel máximo!</h4>
                                             <p className="text-sm text-white/40 mt-1">
                                                  Tienes acceso a todas las funcionalidades exclusivas de BarFlow.
                                             </p>
                                        </div>
                                   )}
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
}
