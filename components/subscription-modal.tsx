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
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  Building2,
  MessageSquare,
} from "lucide-react";
import { getStripe } from "@/lib/stripe/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { PLAN_PRICING } from "@/lib/stripe/config";
import {
  planTypeToCardName,
  planTypeToBillingCycle,
} from "@/lib/pricing/recommendation";

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
  const { user, recommendedPlan } = useAuth();
  const recommendedCardName = planTypeToCardName(recommendedPlan);

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

  // Pre-select billing cycle from the user's recommended plan (yearly fallback).
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    planTypeToBillingCycle(recommendedPlan),
  );

  const plans = [
    {
      name: billingCycle === "yearly" ? "starter-yearly" : "starter-monthly",
      title: "Starter",
      subtitle: "1 Sucursal",
      price:
        billingCycle === "yearly"
          ? `$${PLAN_PRICING.starter.yearly.toLocaleString("es-MX")}`
          : `$${PLAN_PRICING.starter.monthly.toLocaleString("es-MX")}`,
      period: billingCycle === "yearly" ? "/mes (anual)" : "/mes",
      detail: `Hasta ${PLAN_PRICING.starter.baseUsers} usuarios`,
      priceId:
        billingCycle === "yearly"
          ? process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID!
          : process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID!,
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
      yearlyNote:
        billingCycle === "yearly"
          ? `$${(PLAN_PRICING.starter.yearly * 12).toLocaleString("es-MX")}/año`
          : undefined,
      monthlyCompare:
        billingCycle === "yearly"
          ? `$${PLAN_PRICING.starter.monthly.toLocaleString("es-MX")}/mes`
          : undefined,
      features: [
        "1 sucursal",
        `Hasta ${PLAN_PRICING.starter.baseUsers} usuarios`,
        "Ventas y gestión administrativa",
        "Gestión completa de inventario",
        "Importación rápida con IA",
        "Soporte por email",
      ],
    },
    {
      name: billingCycle === "yearly" ? "business-yearly" : "business-monthly",
      title: "Business",
      subtitle: "1 Sucursal",
      price:
        billingCycle === "yearly"
          ? `$${PLAN_PRICING.business.yearly.toLocaleString("es-MX")}`
          : `$${PLAN_PRICING.business.monthly.toLocaleString("es-MX")}`,
      period: billingCycle === "yearly" ? "/mes (anual)" : "/mes",
      detail: `Hasta ${PLAN_PRICING.business.baseUsers} usuarios`,
      priceId:
        billingCycle === "yearly"
          ? process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID!
          : process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID!,
      icon: Sparkles,
      color: "from-purple-500 to-pink-500",
      badge: "Más Popular",
      popular: true,
      yearlyNote:
        billingCycle === "yearly"
          ? `$${(PLAN_PRICING.business.yearly * 12).toLocaleString("es-MX")}/año`
          : undefined,
      monthlyCompare:
        billingCycle === "yearly"
          ? `$${PLAN_PRICING.business.monthly.toLocaleString("es-MX")}/mes`
          : undefined,
      features: [
        "1 sucursal",
        `Hasta ${PLAN_PRICING.business.baseUsers} usuarios`,
        "Blindaje de inventarios y mermas",
        "Proyecciones de inventario con IA",
        "Análisis de ventas en tiempo real",
        "Reportes avanzados",
        "Soporte prioritario",
      ],
    },
    {
      name: "cadena",
      title: "Cadena",
      subtitle: "2–5 Sucursales",
      price:
        billingCycle === "yearly"
          ? `$${PLAN_PRICING.cadena.yearlyPerBranch.toLocaleString("es-MX")}`
          : `$${PLAN_PRICING.cadena.monthlyPerBranch.toLocaleString("es-MX")}`,
      period: "/sucursal/mes",
      detail: "Por sucursal adicional",
      icon: Building2,
      color: "from-orange-500 to-red-500",
      badge: "Multi-sucursal",
      isQuote: true,
      features: [
        "2 a 5 sucursales",
        "Dashboard consolidado",
        "Transferencias entre sucursales",
        "IA avanzada: tendencias y proyecciones",
        "Automatizaciones admin",
        "Soporte 24/7 prioritario",
      ],
    },
    {
      name: "enterprise",
      title: "Enterprise",
      subtitle: "+5 Sucursales",
      price: "Personalizado",
      period: "",
      detail: `Base $${PLAN_PRICING.enterprise.baseFee.toLocaleString("es-MX")} + $${billingCycle === "yearly" ? PLAN_PRICING.enterprise.yearlyPerBranch.toLocaleString("es-MX") : PLAN_PRICING.enterprise.monthlyPerBranch.toLocaleString("es-MX")}/sucursal`,
      icon: Crown,
      color: "from-amber-500 to-orange-500",
      isQuote: true,
      features: [
        "Sucursales ilimitadas",
        "Todas las funcionalidades",
        "Proyección de ventas",
        "Calculadora ROI",
        "API dedicada",
        "Gerente de cuenta dedicado",
        "Integraciones personalizadas",
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
              : "Desbloquea todo el potencial de Stttock"}
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            {trialEnded
              ? "Suscríbete ahora para continuar optimizando la operación de tu bar"
              : "Elige el plan que mejor se adapte a tu negocio"}
          </DialogDescription>
        </DialogHeader>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <span
            className={`text-sm font-medium ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}
          >
            Mensual
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
            }
            className={`relative w-14 h-7 rounded-full transition-colors ${billingCycle === "yearly" ? "bg-purple-500" : "bg-muted"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${billingCycle === "yearly" ? "translate-x-7" : ""}`}
            />
          </button>
          <span
            className={`text-sm font-medium ${billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground"}`}
          >
            Anual{" "}
            <span className="text-green-500 text-xs font-semibold">
              Ahorra ~20%
            </span>
          </span>
        </div>

        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-5 mt-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isRecommended =
              !!recommendedCardName && plan.title === recommendedCardName;
            return (
              <div key={plan.name} className="relative group">
                <div
                  className={`absolute -inset-0.5 bg-gradient-to-r ${plan.color} rounded-2xl blur ${isRecommended ? "opacity-60" : "opacity-30"} group-hover:opacity-70 transition duration-500`}
                />

                <div
                  className={`relative bg-card border rounded-2xl p-5 h-full flex flex-col ${
                    isRecommended
                      ? "border-2 border-emerald-500 ring-2 ring-emerald-500/40"
                      : plan.popular
                        ? "border-2 border-purple-500"
                        : ""
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500">
                        <Sparkles className="w-3 h-3" />
                        Recomendado para ti
                      </span>
                    </div>
                  )}
                  {plan.badge && !isRecommended && (
                    <div className="absolute -top-3 right-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${plan.color}`}
                      >
                        <Sparkles className="w-3 h-3" />
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${plan.color} bg-opacity-10`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{plan.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {plan.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground text-sm">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    {plan.detail && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {plan.detail}
                      </p>
                    )}
                    {plan.monthlyCompare && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="line-through">
                          {plan.monthlyCompare}
                        </span>{" "}
                        <span className="text-green-600 font-semibold">
                          Ahorra $
                          {(
                            (plan.name.includes("starter")
                              ? PLAN_PRICING.starter.monthly -
                                PLAN_PRICING.starter.yearly
                              : PLAN_PRICING.business.monthly -
                                PLAN_PRICING.business.yearly) * 12
                          ).toLocaleString("es-MX")}
                          /año
                        </span>
                      </p>
                    )}
                    {plan.yearlyNote && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan.yearlyNote}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      MXN + IVA
                    </p>
                  </div>

                  <ul className="space-y-2.5 mb-5 flex-grow">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Extra users note */}
                  <p className="text-[11px] text-muted-foreground mb-3">
                    +5 usuarios adicionales: $
                    {PLAN_PRICING.extraUsersBlockRate.toLocaleString("es-MX")}{" "}
                    MXN/mes por bloque. Dispositivos: $0.
                  </p>

                  {plan.isQuote ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false);
                        window.location.href = "/dashboard/cuenta";
                      }}
                      className={`w-full border-current font-semibold h-11`}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Solicitar Cotización
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(plan.priceId!, plan.name)}
                      disabled={loading !== null}
                      className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-semibold h-11 shadow-lg transition-all duration-300`}
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
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
          <p className="text-sm text-center text-muted-foreground">
            🔒 Pago seguro procesado por Stripe • Puedes cancelar en cualquier
            momento; no se te cobrará antes de finalizar tu periodo de prueba.
          </p>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Sin compromisos a largo plazo
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
