"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useStaff } from "@/contexts/staff-context";
import { StaffRole } from "@/lib/roles";
import { useLanguage } from "@/hooks/use-language";

interface PinApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onApproved: (approver: { name: string; role: StaffRole }) => void;
}

export function PinApprovalModal({
  open,
  onOpenChange,
  title,
  description,
  onApproved,
}: PinApprovalModalProps) {
  const { language } = useLanguage();
  const { verifyApprovalPin } = useStaff();

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state whenever modal opens
  useEffect(() => {
    if (open) {
      setPin("");
      setError("");
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      setError(language === "es" ? "Ingresa 4 dígitos" : "Enter 4 digits");
      return;
    }
    setLoading(true);
    setError("");

    const result = await verifyApprovalPin(pin);

    if (result.ok) {
      toast.success(
        language === "es"
          ? `Aprobado por ${result.approverName}`
          : `Approved by ${result.approverName}`,
      );
      onApproved({ name: result.approverName, role: result.approverRole });
      onOpenChange(false);
    } else {
      setError(language === "es" ? "PIN inválido" : "Invalid PIN");
      setPin("");
      inputRef.current?.focus();
    }

    setLoading(false);
  };

  const defaultTitle =
    language === "es" ? "Aprobación requerida" : "Approval required";
  const defaultDescription =
    language === "es"
      ? "Solicita el PIN del Jefe de Piso, Jefe de Barra o Administrador"
      : "Enter the PIN from a Floor Manager, Bar Manager, or Admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            <DialogTitle>{title ?? defaultTitle}</DialogTitle>
          </div>
          <DialogDescription>
            {description ?? defaultDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            placeholder="• • • •"
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
              setPin(val);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            className="text-center text-2xl tracking-[0.5em] font-mono"
            disabled={loading}
          />
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {language === "es" ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={loading || pin.length !== 4}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : language === "es" ? (
              "Confirmar"
            ) : (
              "Confirm"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
