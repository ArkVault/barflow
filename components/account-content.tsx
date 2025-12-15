"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
     Crown,
     CheckCircle,
     Clock,
     Edit2,
     Save,
     Sparkles,
     Lock,
     Building2,
     Eye,
     EyeOff,
     Zap,
     X,
     Send,
     Mail,
     Phone,
     User,
     MessageSquare,
     Plug,
} from "lucide-react";
import { GlowButton } from "./glow-button";
import { useLanguage } from "@/hooks/use-language";

interface UserProfile {
     email: string;
     full_name: string;
     establishment_name: string;
     phone: string;
}

interface QuoteFormData {
     name: string;
     email: string;
     phone: string;
     businessName: string;
     branches: string;
     message: string;
}

export default function AccountContent() {
     const { user, establishmentId } = useAuth();
     const { subscription } = useSubscription();
     const { language } = useLanguage();
     const [profile, setProfile] = useState<UserProfile>({
          email: "",
          full_name: "",
          establishment_name: "",
          phone: "",
     });
     const [isEditing, setIsEditing] = useState(false);
     const [isSaving, setIsSaving] = useState(false);
     const [isUpgrading, setIsUpgrading] = useState(false);
     const [activeTab, setActiveTab] = useState<"profile" | "security" | "subscription" | "connections">("profile");
     const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);
     const [showQuoteModal, setShowQuoteModal] = useState(false);
     const [isSendingQuote, setIsSendingQuote] = useState(false);

     // Quote form state
     const [quoteForm, setQuoteForm] = useState<QuoteFormData>({
          name: "",
          email: "",
          phone: "",
          businessName: "",
          branches: "",
          message: "",
     });

     // Password change state
     const [passwords, setPasswords] = useState({
          current: "",
          new: "",
          confirm: "",
     });
     const [showPasswords, setShowPasswords] = useState({
          current: false,
          new: false,
          confirm: false,
     });
     const [isChangingPassword, setIsChangingPassword] = useState(false);

     useEffect(() => {
          if (user && establishmentId) {
               fetchProfile();
          }
     }, [user, establishmentId]);

     // Pre-fill quote form with profile data
     useEffect(() => {
          if (profile.email || profile.full_name) {
               setQuoteForm(prev => ({
                    ...prev,
                    name: profile.full_name || prev.name,
                    email: profile.email || prev.email,
                    phone: profile.phone || prev.phone,
                    businessName: profile.establishment_name || prev.businessName,
               }));
          }
     }, [profile]);

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
               toast.success(language === 'es' ? "Perfil actualizado correctamente" : "Profile updated successfully");
               setIsEditing(false);
          } catch (error) {
               console.error("Error updating profile:", error);
               toast.error(language === 'es' ? "Error al actualizar el perfil" : "Error updating profile");
          } finally {
               setIsSaving(false);
          }
     };

     const handleChangePassword = async () => {
          if (passwords.new !== passwords.confirm) {
               toast.error(language === 'es' ? "Las contraseñas no coinciden" : "Passwords don't match");
               return;
          }
          if (passwords.new.length < 6) {
               toast.error(language === 'es' ? "La contraseña debe tener al menos 6 caracteres" : "Password must be at least 6 characters");
               return;
          }

          setIsChangingPassword(true);
          try {
               const supabase = createClient();
               const { error } = await supabase.auth.updateUser({
                    password: passwords.new,
               });

               if (error) throw error;

               toast.success(language === 'es' ? "Contraseña actualizada correctamente" : "Password updated successfully");
               setPasswords({ current: "", new: "", confirm: "" });
          } catch (error: any) {
               console.error("Error changing password:", error);
               toast.error(error.message || (language === 'es' ? "Error al cambiar la contraseña" : "Error changing password"));
          } finally {
               setIsChangingPassword(false);
          }
     };

     const handleSendQuote = async () => {
          // Validate form
          if (!quoteForm.name || !quoteForm.email || !quoteForm.phone || !quoteForm.branches) {
               toast.error(language === 'es' ? "Por favor completa todos los campos requeridos" : "Please fill in all required fields");
               return;
          }

          setIsSendingQuote(true);
          try {
               const response = await fetch('/api/send-quote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(quoteForm),
               });

               const data = await response.json();

               if (!response.ok) {
                    throw new Error(data.error || 'Failed to send quote');
               }

               toast.success(
                    language === 'es'
                         ? "¡Solicitud enviada! Te contactaremos pronto."
                         : "Request sent! We'll contact you soon."
               );
               setShowQuoteModal(false);
               setQuoteForm({
                    name: profile.full_name || "",
                    email: profile.email || "",
                    phone: profile.phone || "",
                    businessName: profile.establishment_name || "",
                    branches: "",
                    message: "",
               });
          } catch (error) {
               console.error("Error sending quote:", error);
               toast.error(language === 'es' ? "Error al enviar la solicitud" : "Error sending request");
          } finally {
               setIsSendingQuote(false);
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
                         userId: user?.id,
                         userEmail: profile.email,
                         establishmentId,
                         successUrl: `${window.location.origin}/dashboard/cuenta?success=true`,
                         cancelUrl: `${window.location.origin}/dashboard/cuenta?canceled=true`,
                    }),
               });

               const data = await response.json();
               if (data.error) {
                    toast.error(data.error);
                    return;
               }

               // Redirect to Stripe Checkout using the URL directly
               if (data.url) {
                    window.location.href = data.url;
               } else {
                    toast.error(language === 'es' ? "Error al crear la sesión de pago" : "Error creating payment session");
               }
          } catch (error) {
               console.error("Error creating checkout session:", error);
               toast.error(language === 'es' ? "Error al procesar el upgrade" : "Error processing upgrade");
          } finally {
               setIsUpgrading(false);
          }
     };

     const getPlanName = () => {
          switch (subscription.planType) {
               case "chain": return language === 'es' ? "Plan Cadena" : "Chain Plan";
               case "bar_yearly": return language === 'es' ? "1 Bar (Anual)" : "1 Bar (Yearly)";
               case "bar_monthly": return language === 'es' ? "1 Bar (Mensual)" : "1 Bar (Monthly)";
               default: return language === 'es' ? "Trial Gratuito" : "Free Trial";
          }
     };

     const currentPlanIsTopTier = subscription.planType === "chain";

     return (
          <div className="max-w-5xl mx-auto p-6 space-y-8">
               {/* Header */}
               <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">{language === 'es' ? 'Mi Cuenta' : 'My Account'}</h1>
                    <p className="text-muted-foreground">
                         {language === 'es' ? 'Administra tu perfil, seguridad y suscripción' : 'Manage your profile, security and subscription'}
                    </p>
               </div>

               {/* Tabs */}
               <div className="flex gap-6 border-b border-border">
                    <button
                         onClick={() => setActiveTab("profile")}
                         className={`relative pb-4 text-sm font-medium transition-colors ${activeTab === "profile" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                         {language === 'es' ? 'Datos de perfil' : 'Profile Data'}
                         {activeTab === "profile" && (
                              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                         )}
                    </button>
                    <button
                         onClick={() => setActiveTab("security")}
                         className={`relative pb-4 text-sm font-medium transition-colors ${activeTab === "security" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                         {language === 'es' ? 'Seguridad' : 'Security'}
                         {activeTab === "security" && (
                              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                         )}
                    </button>
                    <button
                         onClick={() => setActiveTab("subscription")}
                         className={`relative pb-4 text-sm font-medium transition-colors ${activeTab === "subscription" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                         {language === 'es' ? 'Suscripción' : 'Subscription'}
                         {activeTab === "subscription" && (
                              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
                         )}
                    </button>
                    <button
                         onClick={() => setActiveTab("connections")}
                         className={`relative pb-4 text-sm font-medium transition-colors ${activeTab === "connections" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                         {language === 'es' ? 'Conexiones' : 'Connections'}
                         {activeTab === "connections" && (
                              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
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
                                                  {language === 'es' ? 'Nombre completo' : 'Full Name'}
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
                                                  {language === 'es' ? 'Teléfono' : 'Phone'}
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
                                                  {language === 'es' ? 'Establecimiento' : 'Establishment'}
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
                                             <Button variant="outline" onClick={() => setIsEditing(true)}>
                                                  <Edit2 className="mr-2 h-4 w-4" />
                                                  {language === 'es' ? 'Editar perfil' : 'Edit Profile'}
                                             </Button>
                                        ) : (
                                             <div className="flex gap-3">
                                                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                                                       {language === 'es' ? 'Cancelar' : 'Cancel'}
                                                  </Button>
                                                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                                                       {isSaving ? (
                                                            <span className="flex items-center gap-2">
                                                                 <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                                                 {language === 'es' ? 'Guardando...' : 'Saving...'}
                                                            </span>
                                                       ) : (
                                                            <>
                                                                 <Save className="mr-2 h-4 w-4" />
                                                                 {language === 'es' ? 'Guardar cambios' : 'Save Changes'}
                                                            </>
                                                       )}
                                                  </Button>
                                             </div>
                                        )}
                                   </div>
                              </div>
                         </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === "security" && (
                         <div className="space-y-8">
                              <div className="neumorphic rounded-2xl p-8 space-y-6">
                                   <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-full bg-green-500/10">
                                             <Lock className="h-5 w-5 text-green-500" />
                                        </div>
                                        <div>
                                             <h3 className="text-lg font-semibold">{language === 'es' ? 'Cambiar Contraseña' : 'Change Password'}</h3>
                                             <p className="text-sm text-muted-foreground">
                                                  {language === 'es' ? 'Actualiza tu contraseña de acceso' : 'Update your access password'}
                                             </p>
                                        </div>
                                   </div>

                                   <div className="grid gap-4 max-w-md">
                                        <div className="space-y-2">
                                             <Label>{language === 'es' ? 'Nueva contraseña' : 'New password'}</Label>
                                             <div className="relative">
                                                  <Input
                                                       type={showPasswords.new ? "text" : "password"}
                                                       value={passwords.new}
                                                       onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                       placeholder="••••••••"
                                                  />
                                                  <button
                                                       type="button"
                                                       onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                       className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                  >
                                                       {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                  </button>
                                             </div>
                                        </div>

                                        <div className="space-y-2">
                                             <Label>{language === 'es' ? 'Confirmar nueva contraseña' : 'Confirm new password'}</Label>
                                             <div className="relative">
                                                  <Input
                                                       type={showPasswords.confirm ? "text" : "password"}
                                                       value={passwords.confirm}
                                                       onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                       placeholder="••••••••"
                                                  />
                                                  <button
                                                       type="button"
                                                       onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                       className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                  >
                                                       {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                  </button>
                                             </div>
                                        </div>

                                        <Button
                                             onClick={handleChangePassword}
                                             disabled={isChangingPassword || !passwords.new || !passwords.confirm}
                                             className="mt-4"
                                        >
                                             {isChangingPassword ? (
                                                  <span className="flex items-center gap-2">
                                                       <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                                       {language === 'es' ? 'Actualizando...' : 'Updating...'}
                                                  </span>
                                             ) : (
                                                  <>
                                                       <Lock className="mr-2 h-4 w-4" />
                                                       {language === 'es' ? 'Actualizar contraseña' : 'Update Password'}
                                                  </>
                                             )}
                                        </Button>
                                   </div>
                              </div>
                         </div>
                    )}

                    {/* Subscription Tab */}
                    {activeTab === "subscription" && (
                         <div className="space-y-8">
                              {/* Current Plan Card with Trial Counter */}
                              <div className="neumorphic rounded-2xl p-8">
                                   <div className="flex items-start justify-between mb-6">
                                        <div>
                                             <p className="text-sm font-medium text-muted-foreground mb-1">
                                                  {language === 'es' ? 'Plan Actual' : 'Current Plan'}
                                             </p>
                                             <div className="flex items-center gap-3">
                                                  <h3 className="text-3xl font-semibold tracking-tight">
                                                       {getPlanName()}
                                                  </h3>
                                                  {subscription.isTrialing && (
                                                       <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                                                            <Clock className="h-4 w-4 text-amber-500" />
                                                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                                                 {subscription.daysRemaining} {language === 'es' ? 'días restantes' : 'days left'}
                                                            </span>
                                                       </div>
                                                  )}
                                             </div>
                                        </div>
                                        <div className={`rounded-full p-3 ring-1 ${subscription.isTrialing ? 'bg-amber-500/10 ring-amber-500/20' : 'bg-green-500/10 ring-green-500/20'}`}>
                                             {subscription.isTrialing ? (
                                                  <Clock className="h-7 w-7 text-amber-500" />
                                             ) : (
                                                  <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-500" />
                                             )}
                                        </div>
                                   </div>

                                   {/* Trial Days Counter - Prominent Display */}
                                   {subscription.isTrialing && (
                                        <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                                             <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-4">
                                                       <div className="p-3 rounded-full bg-amber-500/20">
                                                            <Clock className="h-8 w-8 text-amber-500" />
                                                       </div>
                                                       <div>
                                                            <p className="text-sm text-muted-foreground">
                                                                 {language === 'es' ? 'Tiempo restante de prueba' : 'Trial time remaining'}
                                                            </p>
                                                            <p className="text-4xl font-bold text-amber-500">
                                                                 {subscription.daysRemaining} {language === 'es' ? 'días' : 'days'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                 {language === 'es' ? 'de 30 días de prueba gratuita' : 'of 30-day free trial'}
                                                            </p>
                                                       </div>
                                                  </div>
                                                  <div className="text-right">
                                                       <p className="text-xs text-muted-foreground mb-1">
                                                            {language === 'es' ? 'Vence el' : 'Expires on'}
                                                       </p>
                                                       <p className="text-sm font-medium">
                                                            {subscription.trialEndDate?.toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US', {
                                                                 day: 'numeric',
                                                                 month: 'long',
                                                                 year: 'numeric'
                                                            })}
                                                       </p>
                                                  </div>
                                             </div>
                                             <p className="mt-4 text-sm text-muted-foreground text-center">
                                                  {language === 'es'
                                                       ? '⚠️ Al terminar el período de prueba, necesitarás un plan activo para continuar.'
                                                       : '⚠️ After the trial ends, you\'ll need an active plan to continue.'}
                                             </p>
                                        </div>
                                   )}

                                   {/* Upgrade Button */}
                                   {!currentPlanIsTopTier && !showUpgradeOptions && (
                                        <GlowButton
                                             onClick={() => setShowUpgradeOptions(true)}
                                             className="w-full"
                                        >
                                             <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-inner">
                                                  <Sparkles className="w-3.5 h-3.5 text-white" />
                                             </div>
                                             <span>{language === 'es' ? 'Mejorar Plan' : 'Upgrade Plan'}</span>
                                        </GlowButton>
                                   )}
                              </div>

                              {/* Plan Cards */}
                              {(showUpgradeOptions || subscription.isTrialing) && !currentPlanIsTopTier && (
                                   <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                             <h4 className="text-xl font-semibold">
                                                  {language === 'es' ? 'Planes Disponibles' : 'Available Plans'}
                                             </h4>
                                             {showUpgradeOptions && !subscription.isTrialing && (
                                                  <button
                                                       onClick={() => setShowUpgradeOptions(false)}
                                                       className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                  >
                                                       {language === 'es' ? 'Ocultar' : 'Hide'}
                                                  </button>
                                             )}
                                        </div>

                                        <div className="grid gap-6 lg:grid-cols-3">
                                             {/* Plan 1: Barmode - 1 Bar */}
                                             <div className="relative neumorphic rounded-2xl p-6 space-y-5 hover:scale-[1.02] transition-transform border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5">
                                                  <div className="absolute -top-3 left-4">
                                                       <div className="inline-flex rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-lg">
                                                            {language === 'es' ? 'Más Popular' : 'Most Popular'}
                                                       </div>
                                                  </div>

                                                  <div className="flex items-center gap-3 pt-2">
                                                       <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                                                            <Building2 className="h-6 w-6 text-white" />
                                                       </div>
                                                       <div>
                                                            <h5 className="text-xl font-bold">Barmode - 1 Bar</h5>
                                                            <p className="text-sm text-muted-foreground">
                                                                 {language === 'es' ? 'Una ubicación' : 'One location'}
                                                            </p>
                                                       </div>
                                                  </div>

                                                  <div className="space-y-2">
                                                       <div className="flex items-baseline gap-2">
                                                            <span className="text-4xl font-bold">$1,999</span>
                                                            <span className="text-muted-foreground">{language === 'es' ? '/mes' : '/month'}</span>
                                                       </div>
                                                       <p className="text-sm text-muted-foreground">
                                                            {language === 'es' ? 'Pago mensual' : 'Monthly payment'}
                                                       </p>

                                                       <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                                            <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                                                 💰 {language === 'es' ? 'Ahorra con el plan anual' : 'Save with yearly plan'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                 $1,665{language === 'es' ? '/mes (pago anual $19,980)' : '/mo (yearly $19,980)'}
                                                            </p>
                                                            <p className="text-xs font-medium text-green-500 mt-1">
                                                                 {language === 'es' ? '¡2 meses gratis!' : '2 months free!'}
                                                            </p>
                                                       </div>
                                                  </div>

                                                  <ul className="space-y-2">
                                                       {[
                                                            language === 'es' ? "1 sucursal" : "1 branch",
                                                            language === 'es' ? "Inventario ilimitado" : "Unlimited inventory",
                                                            language === 'es' ? "Importación rápida con IA" : "Fast AI import",
                                                            language === 'es' ? "Proyecciones con IA" : "AI projections",
                                                            language === 'es' ? "Gestión de ventas" : "Sales management",
                                                            language === 'es' ? "Soporte por email" : "Email support",
                                                       ].map((feature, i) => (
                                                            <li key={i} className="flex items-center gap-2 text-sm">
                                                                 <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                                 {feature}
                                                            </li>
                                                       ))}
                                                  </ul>

                                                  <Button
                                                       onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID!)}
                                                       disabled={isUpgrading}
                                                       className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
                                                  >
                                                       {isUpgrading ? (
                                                            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                                       ) : (
                                                            language === 'es' ? "Elegir Plan" : "Choose Plan"
                                                       )}
                                                  </Button>
                                             </div>

                                             {/* Plan 2: Barmode - Cadena (5 sucursales) */}
                                             <div className="relative neumorphic rounded-2xl p-6 space-y-5 hover:scale-[1.02] transition-transform border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5">
                                                  <div className="absolute -top-3 left-4">
                                                       <div className="inline-flex rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-lg">
                                                            {language === 'es' ? 'Crecimiento' : 'Growth'}
                                                       </div>
                                                  </div>

                                                  <div className="flex items-center gap-3 pt-2">
                                                       <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                                                            <Zap className="h-6 w-6 text-white" />
                                                       </div>
                                                       <div>
                                                            <h5 className="text-xl font-bold">Barmode - Cadena</h5>
                                                            <p className="text-sm text-muted-foreground">
                                                                 {language === 'es' ? 'Hasta 5 sucursales' : 'Up to 5 branches'}
                                                            </p>
                                                       </div>
                                                  </div>

                                                  <div className="space-y-2">
                                                       <div className="flex items-baseline gap-2">
                                                            <span className="text-4xl font-bold">$3,999</span>
                                                            <span className="text-muted-foreground">{language === 'es' ? '/mes' : '/month'}</span>
                                                       </div>
                                                       <p className="text-sm text-muted-foreground">
                                                            {language === 'es' ? 'Hasta 5 sucursales incluidas' : 'Up to 5 branches included'}
                                                       </p>

                                                       <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                                                 💎 {language === 'es' ? 'Plan anual disponible' : 'Yearly plan available'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                 $39,990{language === 'es' ? '/año (2 meses gratis)' : '/year (2 months free)'}
                                                            </p>
                                                       </div>
                                                  </div>

                                                  <ul className="space-y-2">
                                                       {[
                                                            language === 'es' ? "Hasta 5 sucursales" : "Up to 5 branches",
                                                            language === 'es' ? "Dashboard consolidado" : "Consolidated dashboard",
                                                            language === 'es' ? "Transferencias entre sucursales" : "Inter-branch transfers",
                                                            language === 'es' ? "IA avanzada: tendencias y proyecciones" : "Advanced AI: trends & projections",
                                                            language === 'es' ? "Automatizaciones admin" : "Admin automations",
                                                            language === 'es' ? "Reportes avanzados" : "Advanced reports",
                                                            language === 'es' ? "Soporte prioritario" : "Priority support",
                                                       ].map((feature, i) => (
                                                            <li key={i} className="flex items-center gap-2 text-sm">
                                                                 <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                                 {feature}
                                                            </li>
                                                       ))}
                                                  </ul>

                                                  <Button
                                                       onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID!)}
                                                       disabled={isUpgrading}
                                                       className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                                                  >
                                                       {isUpgrading ? (
                                                            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                                       ) : (
                                                            language === 'es' ? "Elegir Plan" : "Choose Plan"
                                                       )}
                                                  </Button>
                                             </div>

                                             {/* Plan 3: Barmode - Cadena Enterprise (+5 sucursales) */}
                                             <div className="relative neumorphic rounded-2xl p-6 space-y-5 hover:scale-[1.02] transition-transform border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5">
                                                  <div className="absolute -top-3 left-4">
                                                       <div className="inline-flex rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold text-black uppercase tracking-wider shadow-lg">
                                                            ⭐ Enterprise
                                                       </div>
                                                  </div>

                                                  <div className="flex items-center gap-3 pt-2">
                                                       <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                                                            <Crown className="h-6 w-6 text-white" />
                                                       </div>
                                                       <div>
                                                            <h5 className="text-xl font-bold">Barmode - Cadena+</h5>
                                                            <p className="text-sm text-muted-foreground">
                                                                 {language === 'es' ? 'Más de 5 sucursales' : 'More than 5 branches'}
                                                            </p>
                                                       </div>
                                                  </div>

                                                  <div className="space-y-2">
                                                       <div className="flex items-baseline gap-2">
                                                            <span className="text-3xl font-bold">{language === 'es' ? 'Personalizado' : 'Custom'}</span>
                                                       </div>
                                                       <p className="text-sm text-muted-foreground">
                                                            {language === 'es' ? 'Precio según necesidades' : 'Price based on needs'}
                                                       </p>

                                                       <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                                                 🚀 {language === 'es' ? 'Solución a medida' : 'Tailored solution'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                 {language === 'es' ? 'Precio por sucursal con descuentos por volumen' : 'Per-branch pricing with volume discounts'}
                                                            </p>
                                                       </div>
                                                  </div>

                                                  <ul className="space-y-2">
                                                       {[
                                                            language === 'es' ? "Sucursales ilimitadas" : "Unlimited branches",
                                                            language === 'es' ? "Centralización avanzada" : "Advanced centralization",
                                                            language === 'es' ? "Integraciones personalizadas" : "Custom integrations",
                                                            language === 'es' ? "IA avanzada y predicciones" : "Advanced AI & predictions",
                                                            language === 'es' ? "API dedicada" : "Dedicated API",
                                                            language === 'es' ? "Gerente de cuenta dedicado" : "Dedicated account manager",
                                                       ].map((feature, i) => (
                                                            <li key={i} className="flex items-center gap-2 text-sm">
                                                                 <CheckCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                                 {feature}
                                                            </li>
                                                       ))}
                                                  </ul>

                                                  <Button
                                                       onClick={() => setShowQuoteModal(true)}
                                                       variant="outline"
                                                       className="w-full border-amber-500/50 hover:bg-amber-500/10 hover:border-amber-500 font-semibold"
                                                  >
                                                       <MessageSquare className="mr-2 h-4 w-4" />
                                                       {language === 'es' ? "Obtener Cotización" : "Get Quote"}
                                                  </Button>
                                             </div>
                                        </div>
                                   </div>
                              )}

                              {/* Top Tier Message */}
                              {currentPlanIsTopTier && (
                                   <div className="neumorphic rounded-2xl p-8 text-center space-y-3">
                                        <Crown className="mx-auto h-12 w-12 text-yellow-500" />
                                        <h4 className="text-xl font-semibold">
                                             {language === 'es' ? '¡Estás en el nivel máximo!' : "You're at the top tier!"}
                                        </h4>
                                        <p className="text-muted-foreground">
                                             {language === 'es'
                                                  ? 'Tienes acceso a todas las funcionalidades exclusivas de Barflow.'
                                                  : 'You have access to all exclusive Barflow features.'}
                                        </p>
                                   </div>
                              )}
                         </div>
                    )}

                    {/* Connections Tab */}
                    {activeTab === "connections" && (
                         <div className="space-y-8">
                              <div className="neumorphic rounded-2xl p-8 space-y-6">
                                   <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-full bg-orange-500/10">
                                             <Plug className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <div>
                                             <h3 className="text-lg font-semibold">
                                                  {language === 'es' ? 'Integraciones' : 'Integrations'}
                                             </h3>
                                             <p className="text-sm text-muted-foreground">
                                                  {language === 'es'
                                                       ? 'Conecta servicios externos para automatizar tu negocio'
                                                       : 'Connect external services to automate your business'}
                                             </p>
                                        </div>
                                   </div>

                                   {/* OpenTable Integration Card */}
                                   <div className="border border-border rounded-xl p-6 space-y-4 hover:border-orange-500/50 transition-colors">
                                        <div className="flex items-start justify-between">
                                             <div className="flex items-center gap-4">
                                                  {/* OpenTable Logo */}
                                                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                                       <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                                                       </svg>
                                                  </div>
                                                  <div>
                                                       <h4 className="text-lg font-semibold">OpenTable</h4>
                                                       <p className="text-sm text-muted-foreground">
                                                            {language === 'es'
                                                                 ? 'Sincroniza reservaciones automáticamente'
                                                                 : 'Sync reservations automatically'}
                                                       </p>
                                                  </div>
                                             </div>

                                             {/* Connection Status Badge */}
                                             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                                                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                                  <span className="text-xs font-medium text-muted-foreground">
                                                       {language === 'es' ? 'No conectado' : 'Not connected'}
                                                  </span>
                                             </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                             {language === 'es'
                                                  ? 'Conecta tu cuenta de OpenTable para que las reservaciones se reflejen automáticamente en tus mesas del Punto de Venta.'
                                                  : 'Connect your OpenTable account so reservations automatically reflect on your POS tables.'}
                                        </p>

                                        <div className="flex flex-col gap-2">
                                             <Button
                                                  onClick={() => window.location.href = '/api/integrations/opentable/connect'}
                                                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
                                             >
                                                  <Plug className="mr-2 h-4 w-4" />
                                                  {language === 'es' ? 'Conectar OpenTable' : 'Connect OpenTable'}
                                             </Button>
                                             <p className="text-xs text-center text-muted-foreground">
                                                  {language === 'es'
                                                       ? 'Serás redirigido a OpenTable para autorizar la conexión'
                                                       : 'You will be redirected to OpenTable to authorize the connection'}
                                             </p>
                                        </div>

                                        {/* Features List */}
                                        <div className="pt-4 border-t border-border">
                                             <p className="text-xs font-medium text-muted-foreground mb-3">
                                                  {language === 'es' ? 'Características:' : 'Features:'}
                                             </p>
                                             <ul className="space-y-2">
                                                  {[
                                                       language === 'es' ? 'Sincronización en tiempo real' : 'Real-time synchronization',
                                                       language === 'es' ? 'Actualización automática de estado de mesas' : 'Automatic table status updates',
                                                       language === 'es' ? 'Detalles de cliente y reservación' : 'Customer and reservation details',
                                                       language === 'es' ? 'Notificaciones de cambios' : 'Change notifications',
                                                  ].map((feature, i) => (
                                                       <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                                            {feature}
                                                       </li>
                                                  ))}
                                             </ul>
                                        </div>
                                   </div>

                                   {/* Coming Soon Integrations */}
                                   <div className="border border-dashed border-border rounded-xl p-6 text-center space-y-3 opacity-60">
                                        <div className="flex items-center justify-center gap-2">
                                             <Sparkles className="h-5 w-5 text-muted-foreground" />
                                             <p className="text-sm font-medium text-muted-foreground">
                                                  {language === 'es' ? 'Más integraciones próximamente' : 'More integrations coming soon'}
                                             </p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                             {language === 'es'
                                                  ? 'Uber Eats, Rappi, DiDi Food y más...'
                                                  : 'Uber Eats, Rappi, DiDi Food and more...'}
                                        </p>
                                   </div>
                              </div>
                         </div>
                    )}
               </div>

               {/* Quote Request Modal */}
               {showQuoteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                         <div className="neumorphic rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-300">
                              <div className="flex items-center justify-between mb-6">
                                   <div>
                                        <h3 className="text-xl font-bold">
                                             {language === 'es' ? 'Solicitar Cotización' : 'Request Quote'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                             {language === 'es' ? 'Plan Cadena - Múltiples sucursales' : 'Chain Plan - Multiple branches'}
                                        </p>
                                   </div>
                                   <button
                                        onClick={() => setShowQuoteModal(false)}
                                        className="p-2 rounded-full hover:bg-muted transition-colors"
                                   >
                                        <X className="h-5 w-5" />
                                   </button>
                              </div>

                              <div className="space-y-4">
                                   <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                             <Label className="flex items-center gap-2">
                                                  <User className="h-4 w-4 text-muted-foreground" />
                                                  {language === 'es' ? 'Nombre *' : 'Name *'}
                                             </Label>
                                             <Input
                                                  value={quoteForm.name}
                                                  onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                                                  placeholder={language === 'es' ? 'Tu nombre completo' : 'Your full name'}
                                             />
                                        </div>
                                        <div className="space-y-2">
                                             <Label className="flex items-center gap-2">
                                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                                  {language === 'es' ? 'Email *' : 'Email *'}
                                             </Label>
                                             <Input
                                                  type="email"
                                                  value={quoteForm.email}
                                                  onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                                                  placeholder="tu@email.com"
                                             />
                                        </div>
                                   </div>

                                   <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                             <Label className="flex items-center gap-2">
                                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                                  {language === 'es' ? 'Teléfono *' : 'Phone *'}
                                             </Label>
                                             <Input
                                                  value={quoteForm.phone}
                                                  onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                                                  placeholder="+52 555 123 4567"
                                             />
                                        </div>
                                        <div className="space-y-2">
                                             <Label className="flex items-center gap-2">
                                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                                  {language === 'es' ? 'Nombre del negocio' : 'Business name'}
                                             </Label>
                                             <Input
                                                  value={quoteForm.businessName}
                                                  onChange={(e) => setQuoteForm({ ...quoteForm, businessName: e.target.value })}
                                                  placeholder={language === 'es' ? 'Mi Bar/Restaurante' : 'My Bar/Restaurant'}
                                             />
                                        </div>
                                   </div>

                                   <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                             <Zap className="h-4 w-4 text-muted-foreground" />
                                             {language === 'es' ? '¿Cuántas sucursales necesitas? *' : 'How many branches do you need? *'}
                                        </Label>
                                        <Input
                                             value={quoteForm.branches}
                                             onChange={(e) => setQuoteForm({ ...quoteForm, branches: e.target.value })}
                                             placeholder={language === 'es' ? 'Ej: 3 sucursales actuales, planeamos 5 más' : 'E.g: 3 current branches, planning 5 more'}
                                        />
                                   </div>

                                   <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                             <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                             {language === 'es' ? 'Mensaje adicional (opcional)' : 'Additional message (optional)'}
                                        </Label>
                                        <Textarea
                                             value={quoteForm.message}
                                             onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                                             placeholder={language === 'es'
                                                  ? 'Cuéntanos más sobre tu negocio y necesidades...'
                                                  : 'Tell us more about your business and needs...'}
                                             rows={3}
                                        />
                                   </div>

                                   <div className="flex gap-3 pt-4">
                                        <Button
                                             variant="ghost"
                                             onClick={() => setShowQuoteModal(false)}
                                             className="flex-1"
                                        >
                                             {language === 'es' ? 'Cancelar' : 'Cancel'}
                                        </Button>
                                        <Button
                                             onClick={handleSendQuote}
                                             disabled={isSendingQuote}
                                             className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                        >
                                             {isSendingQuote ? (
                                                  <span className="flex items-center gap-2">
                                                       <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                                       {language === 'es' ? 'Enviando...' : 'Sending...'}
                                                  </span>
                                             ) : (
                                                  <>
                                                       <Send className="mr-2 h-4 w-4" />
                                                       {language === 'es' ? 'Enviar Solicitud' : 'Send Request'}
                                                  </>
                                             )}
                                        </Button>
                                   </div>
                              </div>
                         </div>
                    </div>
               )}
          </div>
     );
}
