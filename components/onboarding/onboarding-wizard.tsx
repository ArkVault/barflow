"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  GitBranch,
  FileSpreadsheet,
  PenLine,
  ChevronRight,
  Check,
  Store,
  Network,
} from "lucide-react";
import { saveOnboardingData } from "./onboarding-actions";
import { toast } from "sonner";

interface RoleCount {
  meseros: number;
  jefeDeBarra: number;
  pisoGerente: number;
  admin: number;
}

type BranchChoice = "single" | "multiple" | null;
type InventoryChoice = "excel" | "manual" | null;

const ROLE_OPTIONS = Array.from({ length: 21 }, (_, i) => i); // 0-20

export function OnboardingWizard() {
  const { user, establishmentId } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: Establishment name
  const [establishmentNameInput, setEstablishmentNameInput] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Roles
  const [roles, setRoles] = useState<RoleCount>({
    meseros: 0,
    jefeDeBarra: 0,
    pisoGerente: 0,
    admin: 1,
  });

  // Step 3: Branch choice
  const [branchChoice, setBranchChoice] = useState<BranchChoice>(null);

  // Step 4: Inventory choice
  const [inventoryChoice, setInventoryChoice] = useState<InventoryChoice>(null);

  const totalSteps = 4;

  // Focus name input when step 0 is active
  useEffect(() => {
    if (currentStep === 0) {
      setTimeout(() => nameInputRef.current?.focus(), 400);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      setDirection(step > currentStep ? 1 : -1);
      setCurrentStep(step);
    },
    [currentStep],
  );

  const handleNameSubmit = useCallback(() => {
    if (establishmentNameInput.trim().length >= 2) {
      goToStep(1);
    }
  }, [establishmentNameInput, goToStep]);

  const handleRolesSubmit = useCallback(() => {
    goToStep(2);
  }, [goToStep]);

  const handleBranchSelect = useCallback(
    (choice: BranchChoice) => {
      setBranchChoice(choice);
      setTimeout(() => goToStep(3), 400);
    },
    [goToStep],
  );

  const handleInventorySelect = useCallback(
    async (choice: InventoryChoice) => {
      setInventoryChoice(choice);
      setIsSaving(true);

      try {
        if (establishmentId) {
          await saveOnboardingData({
            establishmentId,
            establishmentName: establishmentNameInput.trim(),
            roles,
            branchType: branchChoice === "single" ? "single" : "multiple",
            inventoryMethod: choice!,
          });
        }
        // Show completion animation
        setTimeout(() => setIsComplete(true), 400);
        setTimeout(() => {
          // Reload page to reflect new establishment name and onboarding_completed
          window.location.reload();
        }, 2000);
      } catch {
        toast.error("Error al guardar. Intenta de nuevo.");
        setIsSaving(false);
      }
    },
    [establishmentId, establishmentNameInput, roles],
  );

  // Don't show if no user (demo mode)
  if (!user) return null;

  // Slide variants for Typeform-like animations
  const slideVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.95,
    }),
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center"
          >
            <Check className="h-12 w-12 text-green-500" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-foreground"
          >
            ¡Bienvenido, {establishmentNameInput}!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-muted-foreground text-lg"
          >
            Tu cuenta está lista. Preparando tu dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-[101]">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Step counter */}
      <div className="fixed top-6 right-8 text-sm text-muted-foreground z-[101]">
        {currentStep + 1} / {totalSteps}
      </div>

      {/* Logo */}
      <div className="fixed top-6 left-8 z-[101]">
        <img src="/logo-light.png" alt="Stttock" className="h-8 dark:hidden" />
        <img
          src="/logo-dark.png"
          alt="Stttock"
          className="h-8 hidden dark:block"
        />
      </div>

      {/* Slides container */}
      <div className="w-full max-w-2xl px-6">
        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 1: Establishment Name */}
          {currentStep === 0 && (
            <motion.div
              key="step-name"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex flex-col items-center gap-8"
            >
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-foreground">
                  ¿Cómo se llama tu establecimiento?
                </h2>
                <p className="text-muted-foreground text-lg">
                  Este nombre aparecerá en tu dashboard y recibos
                </p>
              </div>
              <div className="w-full max-w-md">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={establishmentNameInput}
                  onChange={(e) => setEstablishmentNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                  placeholder="Ej: Bar La Cantina"
                  className="w-full text-center text-2xl font-medium bg-transparent border-b-2 border-border focus:border-primary outline-none py-4 px-2 transition-colors placeholder:text-muted-foreground/40"
                  autoComplete="off"
                />
              </div>
              <button
                onClick={handleNameSubmit}
                disabled={establishmentNameInput.trim().length < 2}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all"
              >
                Continuar
                <ChevronRight className="h-5 w-5" />
              </button>
              <p className="text-xs text-muted-foreground">
                presiona{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
                  Enter ↵
                </kbd>
              </p>
            </motion.div>
          )}

          {/* Step 2: Users by Role */}
          {currentStep === 1 && (
            <motion.div
              key="step-roles"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex flex-col items-center gap-8"
            >
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-foreground">
                  ¿Cuántos usuarios necesitas?
                </h2>
                <p className="text-muted-foreground text-lg">
                  Selecciona el número de usuarios por cada rol
                </p>
              </div>
              <div className="w-full max-w-md space-y-4">
                {[
                  { key: "meseros" as const, label: "Meseros", icon: "🍽️" },
                  {
                    key: "jefeDeBarra" as const,
                    label: "Jefe de Barra",
                    icon: "🍸",
                  },
                  {
                    key: "pisoGerente" as const,
                    label: "Piso / Gerente",
                    icon: "👔",
                  },
                  { key: "admin" as const, label: "Admin", icon: "⚙️" },
                ].map((role) => (
                  <div
                    key={role.key}
                    className="flex items-center justify-between p-4 rounded-2xl neumorphic bg-background/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{role.icon}</span>
                      <span className="font-medium text-foreground text-lg">
                        {role.label}
                      </span>
                    </div>
                    <select
                      value={roles[role.key]}
                      onChange={(e) =>
                        setRoles((prev) => ({
                          ...prev,
                          [role.key]: parseInt(e.target.value),
                        }))
                      }
                      className="h-10 w-20 rounded-xl bg-muted text-center text-lg font-medium border-0 outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      {ROLE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => goToStep(0)}
                  className="px-6 py-3 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleRolesSubmit}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:opacity-90 transition-all"
                >
                  Continuar
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Branch Type */}
          {currentStep === 2 && (
            <motion.div
              key="step-branch"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex flex-col items-center gap-8"
            >
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <GitBranch className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-foreground">
                  ¿Cuántas sucursales tienes?
                </h2>
                <p className="text-muted-foreground text-lg">
                  Esto nos ayuda a configurar tu cuenta correctamente
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
                <button
                  onClick={() => handleBranchSelect("single")}
                  className={`group relative flex flex-col items-center gap-4 p-8 rounded-3xl neumorphic transition-all duration-300 hover:scale-[1.02] ${
                    branchChoice === "single"
                      ? "ring-2 ring-primary bg-primary/5"
                      : "bg-background/60 hover:bg-muted/50"
                  }`}
                >
                  <Store className="h-12 w-12 text-primary" />
                  <span className="text-xl font-semibold text-foreground">
                    Una Sucursal
                  </span>
                  <span className="text-sm text-muted-foreground text-center">
                    Un solo establecimiento
                  </span>
                </button>
                <button
                  onClick={() => handleBranchSelect("multiple")}
                  className={`group relative flex flex-col items-center gap-4 p-8 rounded-3xl neumorphic transition-all duration-300 hover:scale-[1.02] ${
                    branchChoice === "multiple"
                      ? "ring-2 ring-primary bg-primary/5"
                      : "bg-background/60 hover:bg-muted/50"
                  }`}
                >
                  <Network className="h-12 w-12 text-primary" />
                  <span className="text-xl font-semibold text-foreground">
                    Varias Sucursales
                  </span>
                  <span className="text-sm text-muted-foreground text-center">
                    Cadena o franquicia
                  </span>
                </button>
              </div>
              <button
                onClick={() => goToStep(1)}
                className="px-6 py-3 rounded-full text-muted-foreground hover:text-foreground transition-colors"
              >
                Atrás
              </button>
            </motion.div>
          )}

          {/* Step 4: Inventory Method */}
          {currentStep === 3 && (
            <motion.div
              key="step-inventory"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex flex-col items-center gap-8"
            >
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-foreground">
                  ¿Cómo deseas crear tu inventario?
                </h2>
                <p className="text-muted-foreground text-lg">
                  Puedes cambiar esto después en cualquier momento
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
                <button
                  onClick={() => handleInventorySelect("excel")}
                  disabled={isSaving}
                  className={`group relative flex flex-col items-center gap-4 p-8 rounded-3xl neumorphic transition-all duration-300 hover:scale-[1.02] ${
                    inventoryChoice === "excel"
                      ? "ring-2 ring-primary bg-primary/5"
                      : "bg-background/60 hover:bg-muted/50"
                  } disabled:opacity-50`}
                >
                  <FileSpreadsheet className="h-12 w-12 text-green-600" />
                  <span className="text-xl font-semibold text-foreground">
                    Importar Excel
                  </span>
                  <span className="text-sm text-muted-foreground text-center">
                    Sube tu archivo con datos existentes
                  </span>
                </button>
                <button
                  onClick={() => handleInventorySelect("manual")}
                  disabled={isSaving}
                  className={`group relative flex flex-col items-center gap-4 p-8 rounded-3xl neumorphic transition-all duration-300 hover:scale-[1.02] ${
                    inventoryChoice === "manual"
                      ? "ring-2 ring-primary bg-primary/5"
                      : "bg-background/60 hover:bg-muted/50"
                  } disabled:opacity-50`}
                >
                  <PenLine className="h-12 w-12 text-blue-500" />
                  <span className="text-xl font-semibold text-foreground">
                    Llenar Después
                  </span>
                  <span className="text-sm text-muted-foreground text-center">
                    Agrega tu inventario manualmente
                  </span>
                </button>
              </div>
              {isSaving && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Guardando tu configuración...
                </motion.div>
              )}
              <button
                onClick={() => goToStep(2)}
                disabled={isSaving}
                className="px-6 py-3 rounded-full text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                Atrás
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
