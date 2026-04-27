"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  PauseCircle,
  XCircle,
  Gift,
  CheckCircle,
  Loader2,
  Trash2,
  Database,
  Link2,
  FileX,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/hooks/use-language";
import { PLAN_PRICING } from "@/lib/stripe/config";

type CancelReason =
  | "cost"
  | "features"
  | "competitor"
  | "closed"
  | "technical"
  | "other";

type ModalStep =
  | "reasons"
  | "cost-offer"
  | "pause-or-cancel"
  | "confirm-cancel"
  | "done";

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType: string | null;
  onSuccess: () => void;
}

function getPlanMonthlyPrice(planType: string | null): number {
  switch (planType) {
    case "starter_monthly":
      return PLAN_PRICING.starter.monthly;
    case "starter_yearly":
      return PLAN_PRICING.starter.yearly;
    case "business_monthly":
      return PLAN_PRICING.business.monthly;
    case "business_yearly":
      return PLAN_PRICING.business.yearly;
    default:
      return 0;
  }
}

export function CancelSubscriptionModal({
  open,
  onOpenChange,
  planType,
  onSuccess,
}: CancelSubscriptionModalProps) {
  const { user, establishmentId } = useAuth();
  const { language } = useLanguage();
  const [step, setStep] = useState<ModalStep>("reasons");
  const [selectedReason, setSelectedReason] = useState<CancelReason | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const currentPrice = getPlanMonthlyPrice(planType);
  const discountedPrice = Math.round(currentPrice * 0.8);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("reasons");
      setSelectedReason(null);
    }, 300);
  };

  const handleContinueFromReasons = () => {
    if (!selectedReason) return;
    setStep(selectedReason === "cost" ? "cost-offer" : "pause-or-cancel");
  };

  const callApi = async (action: string) => {
    const res = await fetch("/api/stripe/manage-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId: user?.id, establishmentId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error");
    return data;
  };

  const handleApplyDiscount = async () => {
    setIsLoading(true);
    try {
      await callApi("apply-discount");
      toast.success(
        language === "es"
          ? "¡Descuento aplicado! 20% off por los próximos 3 meses."
          : "Discount applied! 20% off for the next 3 months.",
      );
      setStep("done");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Error al aplicar el descuento");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    setIsLoading(true);
    try {
      await callApi("pause");
      toast.success(
        language === "es"
          ? "Suscripción pausada por 30 días. Los cobros se reanudan automáticamente."
          : "Subscription paused for 30 days. Billing resumes automatically.",
      );
      setStep("done");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Error al pausar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await callApi("cancel");
      toast.success(
        language === "es"
          ? "Cancelación programada. Mantienes acceso hasta el fin del período."
          : "Cancellation scheduled. You keep access until end of current period.",
      );
      setStep("done");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Error al cancelar");
    } finally {
      setIsLoading(false);
    }
  };

  const reasons: { id: CancelReason; label: string }[] = [
    {
      id: "cost",
      label:
        language === "es" ? "El costo es muy alto" : "The cost is too high",
    },
    {
      id: "features",
      label:
        language === "es"
          ? "Le faltan funcionalidades que necesito"
          : "Missing features I need",
    },
    {
      id: "competitor",
      label:
        language === "es"
          ? "Cambié a otro software"
          : "Switched to another software",
    },
    {
      id: "closed",
      label:
        language === "es"
          ? "Mi negocio cerró / ya no lo necesito"
          : "My business closed / no longer need it",
    },
    {
      id: "technical",
      label:
        language === "es"
          ? "Problemas técnicos o de uso"
          : "Technical or usability issues",
    },
    {
      id: "other",
      label: language === "es" ? "Otro motivo" : "Other reason",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {/* ── Step 1: Reason selection ── */}
        {step === "reasons" && (
          <>
            <DialogHeader>
              <DialogTitle>
                {language === "es"
                  ? "¿Por qué quieres cancelar?"
                  : "Why do you want to cancel?"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              {reasons.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReason(r.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                    selectedReason === r.id
                      ? "border-primary bg-primary/10 text-foreground font-medium"
                      : "border-border hover:border-muted-foreground/40 text-muted-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="ghost" onClick={handleClose} className="flex-1">
                {language === "es" ? "Volver" : "Back"}
              </Button>
              <Button
                onClick={handleContinueFromReasons}
                disabled={!selectedReason}
                className="flex-1"
              >
                {language === "es" ? "Continuar" : "Continue"}
              </Button>
            </div>
          </>
        )}

        {/* ── Step 2a: Cost → discount offer ── */}
        {step === "cost-offer" && (
          <>
            <DialogHeader>
              <div className="mx-auto w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <Gift className="h-7 w-7 text-green-500" />
              </div>
              <DialogTitle className="text-center">
                {language === "es"
                  ? "¡Espera! Tenemos una oferta"
                  : "Wait! We have an offer for you"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {language === "es" ? "Tu plan actual" : "Your current plan"}
                </p>
                {currentPrice > 0 ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl text-muted-foreground line-through">
                      ${currentPrice.toLocaleString("es-MX")}/mes
                    </span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                      ${discountedPrice.toLocaleString("es-MX")}/mes
                    </span>
                  </div>
                ) : null}
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {language === "es"
                    ? "20% de descuento por los próximos 3 meses"
                    : "20% off for the next 3 months"}
                </p>
              </div>

              <Button
                onClick={handleApplyDiscount}
                disabled={isLoading}
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-6 text-base"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {language === "es"
                      ? "Aceptar descuento"
                      : "Accept discount"}
                  </>
                )}
              </Button>

              <button
                onClick={() => setStep("confirm-cancel")}
                disabled={isLoading}
                className="w-full text-center text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
              >
                {language === "es"
                  ? "No, continuar con la cancelación"
                  : "No, continue with cancellation"}
              </button>
            </div>
          </>
        )}

        {/* ── Step 2b: Other reasons → pause (big) or cancel (small) ── */}
        {step === "pause-or-cancel" && (
          <>
            <DialogHeader>
              <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
              </div>
              <DialogTitle className="text-center">
                {language === "es"
                  ? "¿Seguro que quieres irte?"
                  : "Are you sure you want to leave?"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              <Button
                onClick={handlePause}
                disabled={isLoading}
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-6 text-base"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <PauseCircle className="mr-2 h-5 w-5" />
                    {language === "es" ? "Pausar 1 mes" : "Pause for 1 month"}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {language === "es"
                  ? "Detén los cobros 30 días. Tu cuenta y datos se conservan."
                  : "Stop charges for 30 days. Your account and data are preserved."}
              </p>

              <div className="border-t border-border pt-3">
                <button
                  onClick={() => setStep("confirm-cancel")}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors py-2"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {language === "es"
                    ? "Cancelar suscripción definitivamente"
                    : "Cancel subscription permanently"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Step 3: Final confirmation ── */}
        {step === "confirm-cancel" && (
          <>
            <DialogHeader>
              <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                <XCircle className="h-7 w-7 text-destructive" />
              </div>
              <DialogTitle className="text-center">
                {language === "es"
                  ? "Confirmar cancelación"
                  : "Confirm cancellation"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {language === "es"
                ? "Tu suscripción seguirá activa hasta el fin del período actual. Al vencer, se eliminará permanentemente:"
                : "Your subscription stays active until the end of the current period. When it expires, the following will be permanently deleted:"}
            </p>
            <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              {[
                {
                  icon: Database,
                  es: "Tu base de datos de inventario y ventas",
                  en: "Your inventory and sales database",
                },
                {
                  icon: FileX,
                  es: "Archivos, menús e imágenes subidas",
                  en: "Uploaded files, menus and images",
                },
                {
                  icon: Link2,
                  es: "Integraciones y conexiones configuradas",
                  en: "Configured integrations and connections",
                },
                {
                  icon: Trash2,
                  es: "Cuenta y todos los datos del establecimiento",
                  en: "Account and all establishment data",
                },
              ].map(({ icon: Icon, es, en }) => (
                <div
                  key={es}
                  className="flex items-center gap-2.5 text-xs text-destructive/80"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-destructive" />
                  <span>{language === "es" ? es : en}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                {language === "es" ? "No, conservar plan" : "No, keep plan"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : language === "es" ? (
                  "Sí, cancelar"
                ) : (
                  "Yes, cancel"
                )}
              </Button>
            </div>
          </>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <>
            <DialogHeader>
              <div className="mx-auto w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <CheckCircle className="h-7 w-7 text-green-500" />
              </div>
              <DialogTitle className="text-center">
                {language === "es" ? "¡Listo!" : "Done!"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {language === "es"
                ? "Los cambios se aplicaron correctamente."
                : "Your changes were applied successfully."}
            </p>
            <Button onClick={handleClose} className="w-full mt-4">
              {language === "es" ? "Cerrar" : "Close"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
