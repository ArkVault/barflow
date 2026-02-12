'use client';

import { Button } from '@/components/ui/button';
import {
     Crown,
     CheckCircle,
     Clock,
     Sparkles,
     Building2,
     Zap,
     MessageSquare,
} from 'lucide-react';
import { GlowButton } from '../glow-button';

interface SubscriptionData {
     planType: string;
     isTrialing: boolean;
     daysRemaining: number;
     trialEndDate: Date | null;
}

interface SubscriptionTabProps {
     subscription: SubscriptionData;
     isUpgrading: boolean;
     showUpgradeOptions: boolean;
     setShowUpgradeOptions: (show: boolean) => void;
     handleUpgrade: (priceId: string) => void;
     getPlanName: () => string;
     setShowQuoteModal: (show: boolean) => void;
     language: string;
}

export function SubscriptionTab({
     subscription,
     isUpgrading,
     showUpgradeOptions,
     setShowUpgradeOptions,
     handleUpgrade,
     getPlanName,
     setShowQuoteModal,
     language,
}: SubscriptionTabProps) {
     const currentPlanIsTopTier = subscription.planType === 'chain';

     return (
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

                    {/* Trial Days Counter */}
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
                              {/* Plan 1: Flowstock - 1 Bar */}
                              <PlanCard
                                   badge={language === 'es' ? 'Más Popular' : 'Most Popular'}
                                   badgeGradient="from-blue-500 to-cyan-500"
                                   borderColor="border-blue-500/20"
                                   bgGradient="from-blue-500/5 via-transparent to-cyan-500/5"
                                   iconBg="from-blue-500 to-cyan-500"
                                   icon={<Building2 className="h-6 w-6 text-white" />}
                                   title="Flowstock - 1 Bar"
                                   subtitle={language === 'es' ? 'Una ubicación' : 'One location'}
                                   price="$1,999"
                                   period={language === 'es' ? '/mes' : '/month'}
                                   priceNote={language === 'es' ? 'Pago mensual' : 'Monthly payment'}
                                   savings={{
                                        text: `💰 ${language === 'es' ? 'Ahorra con el plan anual' : 'Save with yearly plan'}`,
                                        detail: `$1,665${language === 'es' ? '/mes (pago anual $19,980)' : '/mo (yearly $19,980)'}`,
                                        highlight: language === 'es' ? '¡2 meses gratis!' : '2 months free!',
                                        bg: 'bg-green-500/10 border-green-500/20',
                                        textColor: 'text-green-600 dark:text-green-400',
                                        highlightColor: 'text-green-500',
                                   }}
                                   features={[
                                        language === 'es' ? '1 sucursal' : '1 branch',
                                        language === 'es' ? 'Inventario ilimitado' : 'Unlimited inventory',
                                        language === 'es' ? 'Importación rápida con IA' : 'Fast AI import',
                                        language === 'es' ? 'Proyecciones con IA' : 'AI projections',
                                        language === 'es' ? 'Gestión de ventas' : 'Sales management',
                                        language === 'es' ? 'Soporte por email' : 'Email support',
                                   ]}
                                   checkColor="text-green-500"
                                   buttonGradient="from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                                   onUpgrade={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID!)}
                                   isUpgrading={isUpgrading}
                                   buttonText={language === 'es' ? 'Elegir Plan' : 'Choose Plan'}
                              />

                              {/* Plan 2: Flowstock - Cadena */}
                              <PlanCard
                                   badge={language === 'es' ? 'Crecimiento' : 'Growth'}
                                   badgeGradient="from-purple-500 to-pink-500"
                                   borderColor="border-purple-500/20"
                                   bgGradient="from-purple-500/5 via-transparent to-pink-500/5"
                                   iconBg="from-purple-500 to-pink-500"
                                   icon={<Zap className="h-6 w-6 text-white" />}
                                   title="Flowstock - Cadena"
                                   subtitle={language === 'es' ? 'Hasta 5 sucursales' : 'Up to 5 branches'}
                                   price="$3,999"
                                   period={language === 'es' ? '/mes' : '/month'}
                                   priceNote={language === 'es' ? 'Hasta 5 sucursales incluidas' : 'Up to 5 branches included'}
                                   savings={{
                                        text: `💎 ${language === 'es' ? 'Plan anual disponible' : 'Yearly plan available'}`,
                                        detail: `$39,990${language === 'es' ? '/año (2 meses gratis)' : '/year (2 months free)'}`,
                                        bg: 'bg-purple-500/10 border-purple-500/20',
                                        textColor: 'text-purple-600 dark:text-purple-400',
                                   }}
                                   features={[
                                        language === 'es' ? 'Hasta 5 sucursales' : 'Up to 5 branches',
                                        language === 'es' ? 'Dashboard consolidado' : 'Consolidated dashboard',
                                        language === 'es' ? 'Transferencias entre sucursales' : 'Inter-branch transfers',
                                        language === 'es' ? 'IA avanzada: tendencias y proyecciones' : 'Advanced AI: trends & projections',
                                        language === 'es' ? 'Automatizaciones admin' : 'Admin automations',
                                        language === 'es' ? 'Reportes avanzados' : 'Advanced reports',
                                        language === 'es' ? 'Soporte prioritario' : 'Priority support',
                                   ]}
                                   checkColor="text-green-500"
                                   buttonGradient="from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                   onUpgrade={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID!)}
                                   isUpgrading={isUpgrading}
                                   buttonText={language === 'es' ? 'Elegir Plan' : 'Choose Plan'}
                              />

                              {/* Plan 3: Enterprise */}
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
                                             <h5 className="text-xl font-bold">Flowstock - Cadena+</h5>
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
                                             language === 'es' ? 'Sucursales ilimitadas' : 'Unlimited branches',
                                             language === 'es' ? 'Centralización avanzada' : 'Advanced centralization',
                                             language === 'es' ? 'Integraciones personalizadas' : 'Custom integrations',
                                             language === 'es' ? 'IA avanzada y predicciones' : 'Advanced AI & predictions',
                                             language === 'es' ? 'API dedicada' : 'Dedicated API',
                                             language === 'es' ? 'Gerente de cuenta dedicado' : 'Dedicated account manager',
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
                                        {language === 'es' ? 'Obtener Cotización' : 'Get Quote'}
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
                                   ? 'Tienes acceso a todas las funcionalidades exclusivas de Flowstock.'
                                   : 'You have access to all exclusive Flowstock features.'}
                         </p>
                    </div>
               )}
          </div>
     );
}

// Reusable plan card sub-component
interface PlanCardProps {
     badge: string;
     badgeGradient: string;
     borderColor: string;
     bgGradient: string;
     iconBg: string;
     icon: React.ReactNode;
     title: string;
     subtitle: string;
     price: string;
     period: string;
     priceNote: string;
     savings: {
          text: string;
          detail: string;
          highlight?: string;
          bg: string;
          textColor: string;
          highlightColor?: string;
     };
     features: string[];
     checkColor: string;
     buttonGradient: string;
     onUpgrade: () => void;
     isUpgrading: boolean;
     buttonText: string;
}

function PlanCard({
     badge,
     badgeGradient,
     borderColor,
     bgGradient,
     iconBg,
     icon,
     title,
     subtitle,
     price,
     period,
     priceNote,
     savings,
     features,
     checkColor,
     buttonGradient,
     onUpgrade,
     isUpgrading,
     buttonText,
}: PlanCardProps) {
     return (
          <div className={`relative neumorphic rounded-2xl p-6 space-y-5 hover:scale-[1.02] transition-transform border ${borderColor} bg-gradient-to-br ${bgGradient}`}>
               <div className="absolute -top-3 left-4">
                    <div className={`inline-flex rounded-full bg-gradient-to-r ${badgeGradient} px-3 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-lg`}>
                         {badge}
                    </div>
               </div>

               <div className="flex items-center gap-3 pt-2">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${iconBg}`}>
                         {icon}
                    </div>
                    <div>
                         <h5 className="text-xl font-bold">{title}</h5>
                         <p className="text-sm text-muted-foreground">{subtitle}</p>
                    </div>
               </div>

               <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                         <span className="text-4xl font-bold">{price}</span>
                         <span className="text-muted-foreground">{period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{priceNote}</p>

                    <div className={`mt-3 p-3 rounded-lg ${savings.bg}`}>
                         <p className={`text-sm font-medium ${savings.textColor}`}>
                              {savings.text}
                         </p>
                         <p className="text-xs text-muted-foreground">
                              {savings.detail}
                         </p>
                         {savings.highlight && (
                              <p className={`text-xs font-medium ${savings.highlightColor} mt-1`}>
                                   {savings.highlight}
                              </p>
                         )}
                    </div>
               </div>

               <ul className="space-y-2">
                    {features.map((feature, i) => (
                         <li key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle className={`h-4 w-4 ${checkColor} flex-shrink-0`} />
                              {feature}
                         </li>
                    ))}
               </ul>

               <Button
                    onClick={onUpgrade}
                    disabled={isUpgrading}
                    className={`w-full bg-gradient-to-r ${buttonGradient} text-white font-semibold`}
               >
                    {isUpgrading ? (
                         <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                         buttonText
                    )}
               </Button>
          </div>
     );
}
