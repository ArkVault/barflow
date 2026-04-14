"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  MousePointerClick,
  Smartphone,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Clock,
  Calculator,
  Building2,
  Users,
  BarChart3,
} from "lucide-react";
import {
  calculateROI,
  formatMXN,
  getPlanLabel,
  type ROIInputs,
  type ROIResult,
} from "@/lib/roi/calculator";

// ── Neon color palettes (matching chart gradients) ──

const NEON = {
  loss: {
    from: "#ef4444", // red-500
    via: "#f87171", // red-400
    to: "#fca5a5", // red-300
    glow: "rgba(239, 68, 68, 0.5)",
    glowStrong: "rgba(239, 68, 68, 0.8)",
    text: "rgba(252, 165, 165, 0.9)", // soft red
  },
  gain: {
    from: "#10b981", // emerald-500
    via: "#34d399", // emerald-400
    to: "#6ee7b7", // emerald-300
    glow: "rgba(16, 185, 129, 0.5)",
    glowStrong: "rgba(16, 185, 129, 0.8)",
    text: "rgba(110, 231, 183, 0.9)", // soft green
  },
  accent: {
    from: "#f59e0b", // amber-500
    via: "#fbbf24", // amber-400
    to: "#fde68a", // amber-200
    glow: "rgba(245, 158, 11, 0.5)",
    text: "rgba(253, 230, 138, 0.9)",
  },
  info: {
    from: "#8b5cf6", // violet-500
    via: "#a78bfa", // violet-400
    to: "#c4b5fd", // violet-300
    glow: "rgba(139, 92, 246, 0.5)",
    text: "rgba(196, 181, 253, 0.9)",
  },
} as const;

// ── Animated Bar Component (neon gradient) ──

function ComparisonBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: "loss" | "gain";
}) {
  const percentage = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  const palette = color === "loss" ? NEON.loss : NEON.gain;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold" style={{ color: palette.text }}>
          {formatMXN(value)}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${palette.from}, ${palette.via}, ${palette.to})`,
            boxShadow: `0 0 12px ${palette.glow}, 0 0 4px ${palette.glow}`,
          }}
        />
      </div>
    </div>
  );
}

// ── KPI Card (neon glow) ──

function KPICard({
  icon: Icon,
  label,
  value,
  subtitle,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  accent: "gain" | "loss" | "accent";
}) {
  const palette = NEON[accent];

  return (
    <div
      className="p-4 rounded-xl space-y-2 bg-muted/10 border border-muted/20"
      style={{
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 0 20px ${palette.glow}20`,
      }}
    >
      <div className="flex items-center gap-2">
        <Icon
          className="h-4 w-4"
          style={{
            color: palette.via,
            filter: `drop-shadow(0 0 6px ${palette.glow})`,
          }}
        />
        <span className="text-xs text-muted-foreground/70 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div
        className="text-2xl font-bold"
        style={{
          color: palette.text,
          textShadow: `0 0 20px ${palette.glow}, 0 0 40px ${palette.glow}40`,
        }}
      >
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground/60">{subtitle}</p>
      )}
    </div>
  );
}

// ── Value Prop Checklist ──

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Blindaje DNA-Stock",
    description: "Reducción de merma del 30% a menos de 5%",
    metric: 83,
  },
  {
    icon: MousePointerClick,
    title: "Cierres en 1 Click",
    description: "Automatización total de inventario vs ventas",
    metric: 95,
  },
  {
    icon: Smartphone,
    title: "$0 en Dispositivos",
    description: "Funciona en cualquier dispositivo. Sin hardware extra",
    metric: 100,
  },
  {
    icon: BarChart3,
    title: "Proyecciones IA",
    description: "Predicción de demanda con inteligencia artificial",
    metric: 90,
  },
] as const;

// ── Main Component ──

export function ROICalculator() {
  const [monthlySales, setMonthlySales] = useState(150000);
  const [branchCount, setBranchCount] = useState(1);
  const [totalStaff, setTotalStaff] = useState(5);
  const [annualBilling, setAnnualBilling] = useState(true);
  const [shrinkageEnabled, setShrinkageEnabled] = useState(true);

  const inputs: ROIInputs = useMemo(
    () => ({
      monthlySalesPerBranch: monthlySales,
      branchCount,
      totalStaff,
      annualBilling,
      shrinkageEnabled,
    }),
    [monthlySales, branchCount, totalStaff, annualBilling, shrinkageEnabled],
  );

  const result: ROIResult = useMemo(() => calculateROI(inputs), [inputs]);

  const maxBarValue = Math.max(
    result.currentCosts.total,
    result.subscriptionCost.totalMonthly,
  );

  const handleSalesChange = useCallback(
    (v: number[]) => setMonthlySales(v[0]),
    [],
  );
  const handleBranchChange = useCallback(
    (v: number[]) => setBranchCount(v[0]),
    [],
  );
  const handleStaffChange = useCallback(
    (v: number[]) => setTotalStaff(v[0]),
    [],
  );

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-violet-500/10 flex items-center justify-center"
          style={{ boxShadow: `0 0 20px ${NEON.gain.glow}30` }}
        >
          <Calculator
            className="h-5 w-5"
            style={{
              color: NEON.gain.via,
              filter: `drop-shadow(0 0 8px ${NEON.gain.glow})`,
            }}
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Visor de Utilidad & ROI</h2>
          <p className="text-sm text-muted-foreground/70">
            Descubre cómo Flowstock se paga solo eliminando ineficiencias
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Column 1: Inputs ── */}
        <Card className="neumorphic border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp
                className="h-5 w-5"
                style={{
                  color: NEON.info.via,
                  filter: `drop-shadow(0 0 6px ${NEON.info.glow})`,
                }}
              />
              Simulador de Ahorro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Sliders */}
            <div className="space-y-6">
              {/* Monthly Sales */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4 opacity-50" />
                    Ventas Mensuales por Sucursal
                  </Label>
                  <Badge
                    variant="outline"
                    className="font-mono text-sm border-muted/30 text-muted-foreground"
                  >
                    {formatMXN(monthlySales)}
                  </Badge>
                </div>
                <Slider
                  value={[monthlySales]}
                  onValueChange={handleSalesChange}
                  min={50000}
                  max={1000000}
                  step={10000}
                />
                <div className="flex justify-between text-xs text-muted-foreground/50">
                  <span>$50K</span>
                  <span>$1M</span>
                </div>
              </div>

              {/* Branch Count */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 opacity-50" />
                    Número de Sucursales
                  </Label>
                  <Badge
                    variant="outline"
                    className="font-mono text-sm border-muted/30 text-muted-foreground"
                  >
                    {branchCount}
                  </Badge>
                </div>
                <Slider
                  value={[branchCount]}
                  onValueChange={handleBranchChange}
                  min={1}
                  max={15}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground/50">
                  <span>1</span>
                  <span>15</span>
                </div>
              </div>

              {/* Staff */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 opacity-50" />
                    Staff Total
                  </Label>
                  <Badge
                    variant="outline"
                    className="font-mono text-sm border-muted/30 text-muted-foreground"
                  >
                    {totalStaff} personas
                  </Badge>
                </div>
                <Slider
                  value={[totalStaff]}
                  onValueChange={handleStaffChange}
                  min={1}
                  max={50}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground/50">
                  <span>1</span>
                  <span>50</span>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={annualBilling}
                  onCheckedChange={setAnnualBilling}
                />
                <Label className="text-sm text-muted-foreground">
                  Pago Anual
                  {annualBilling && (
                    <span
                      className="ml-1.5 text-xs font-medium"
                      style={{
                        color: NEON.gain.text,
                        textShadow: `0 0 10px ${NEON.gain.glow}`,
                      }}
                    >
                      Ahorro activo
                    </span>
                  )}
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={shrinkageEnabled}
                  onCheckedChange={setShrinkageEnabled}
                />
                <Label className="text-sm text-muted-foreground">
                  Cálculo de Mermas
                </Label>
              </div>
            </div>

            {/* ── Comparative Visualizer ── */}
            <div className="space-y-5 pt-2">
              {/* Side A: Current Costs */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="h-4 w-4"
                    style={{
                      color: NEON.loss.via,
                      filter: `drop-shadow(0 0 6px ${NEON.loss.glow})`,
                    }}
                  />
                  <h3
                    className="text-sm font-semibold uppercase tracking-wide"
                    style={{
                      color: NEON.loss.text,
                      textShadow: `0 0 12px ${NEON.loss.glow}40`,
                    }}
                  >
                    Fuga de Capital Actual
                  </h3>
                </div>
                <div
                  className="p-4 rounded-xl space-y-3 bg-muted/5 border border-muted/10"
                  style={{
                    boxShadow: `inset 0 0 30px ${NEON.loss.glow}08, 0 0 1px ${NEON.loss.glow}20`,
                  }}
                >
                  {shrinkageEnabled && (
                    <ComparisonBar
                      label="Mermas / Robo"
                      value={result.currentCosts.shrinkage}
                      maxValue={maxBarValue}
                      color="loss"
                    />
                  )}
                  <ComparisonBar
                    label="Gestión Manual (horas admin)"
                    value={result.currentCosts.manualManagement}
                    maxValue={maxBarValue}
                    color="loss"
                  />
                  <ComparisonBar
                    label="Software Fragmentado"
                    value={result.currentCosts.fragmentedSoftware}
                    maxValue={maxBarValue}
                    color="loss"
                  />
                  <div className="border-t border-muted/10 pt-2 flex justify-between text-sm font-bold">
                    <span className="text-muted-foreground/80">
                      Total Pérdida Mensual
                    </span>
                    <span
                      style={{
                        color: NEON.loss.text,
                        textShadow: `0 0 16px ${NEON.loss.glow}`,
                      }}
                    >
                      {formatMXN(result.currentCosts.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Side B: Our Solution */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className="h-4 w-4"
                    style={{
                      color: NEON.gain.via,
                      filter: `drop-shadow(0 0 6px ${NEON.gain.glow})`,
                    }}
                  />
                  <h3
                    className="text-sm font-semibold uppercase tracking-wide"
                    style={{
                      color: NEON.gain.text,
                      textShadow: `0 0 12px ${NEON.gain.glow}40`,
                    }}
                  >
                    Inversión Administrador Digital
                  </h3>
                </div>
                <div
                  className="p-4 rounded-xl space-y-3 bg-muted/5 border border-muted/10"
                  style={{
                    boxShadow: `inset 0 0 30px ${NEON.gain.glow}08, 0 0 1px ${NEON.gain.glow}20`,
                  }}
                >
                  <ComparisonBar
                    label={`Plan ${getPlanLabel(result.subscriptionCost.plan)}`}
                    value={result.subscriptionCost.baseCost}
                    maxValue={maxBarValue}
                    color="gain"
                  />
                  {result.subscriptionCost.extraStaffCost > 0 && (
                    <ComparisonBar
                      label="Staff adicional"
                      value={result.subscriptionCost.extraStaffCost}
                      maxValue={maxBarValue}
                      color="gain"
                    />
                  )}
                  <div className="border-t border-muted/10 pt-2 flex justify-between text-sm font-bold">
                    <span className="text-muted-foreground/80">
                      Total Inversión Mensual
                    </span>
                    <span
                      style={{
                        color: NEON.gain.text,
                        textShadow: `0 0 16px ${NEON.gain.glow}`,
                      }}
                    >
                      {formatMXN(result.subscriptionCost.totalMonthly)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── KPI Metrics ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KPICard
                icon={DollarSign}
                label="Dinero Recuperado/Mes"
                value={formatMXN(Math.max(0, result.monthlySavings))}
                subtitle={`${formatMXN(Math.max(0, result.annualSavings))} al año`}
                accent={result.monthlySavings > 0 ? "gain" : "loss"}
              />
              <KPICard
                icon={Clock}
                label="Payback Period"
                value={
                  result.paybackDays === Infinity
                    ? "N/A"
                    : `${result.paybackDays} días`
                }
                subtitle={
                  result.paybackDays <= 30
                    ? "Tu inversión se paga en el primer mes"
                    : "Recuperación dentro del periodo"
                }
                accent={result.paybackDays <= 15 ? "gain" : "accent"}
              />
              <KPICard
                icon={TrendingUp}
                label="ROI"
                value={
                  result.roiPercentage > 0
                    ? `${Math.round(result.roiPercentage)}%`
                    : "—"
                }
                subtitle="Retorno sobre inversión mensual"
                accent={result.roiPercentage > 100 ? "gain" : "accent"}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Column 2: Value Props Checklist ── */}
        <div className="space-y-4">
          <Card className="neumorphic border-0">
            <CardHeader>
              <CardTitle className="text-lg">Ventajas Competitivas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {VALUE_PROPS.map((prop) => (
                <div key={prop.title} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-8 w-8 shrink-0 rounded-lg bg-emerald-500/5 flex items-center justify-center"
                      style={{
                        boxShadow: `0 0 12px ${NEON.gain.glow}20`,
                      }}
                    >
                      <prop.icon
                        className="h-4 w-4"
                        style={{
                          color: NEON.gain.via,
                          filter: `drop-shadow(0 0 4px ${NEON.gain.glow})`,
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{prop.title}</p>
                      <p className="text-xs text-muted-foreground/60">
                        {prop.description}
                      </p>
                    </div>
                  </div>
                  {/* Neon progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-muted/15 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${prop.metric}%`,
                        background: `linear-gradient(90deg, ${NEON.gain.from}, ${NEON.gain.via}, ${NEON.gain.to})`,
                        boxShadow: `0 0 8px ${NEON.gain.glow}, 0 0 3px ${NEON.gain.glow}`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick savings summary card */}
          <Card
            className="neumorphic border-0"
            style={{
              background: `linear-gradient(135deg, rgba(16,185,129,0.03) 0%, rgba(139,92,246,0.03) 100%)`,
              boxShadow: `0 0 30px ${NEON.gain.glow}10`,
            }}
          >
            <CardContent className="pt-6 text-center space-y-3">
              <div
                className="text-3xl font-bold"
                style={{
                  color: NEON.gain.text,
                  textShadow: `0 0 24px ${NEON.gain.glow}, 0 0 48px ${NEON.gain.glow}30`,
                }}
              >
                {result.monthlySavings > 0
                  ? formatMXN(result.monthlySavings)
                  : formatMXN(0)}
              </div>
              <p className="text-sm text-muted-foreground/60">
                ahorro neto mensual estimado
              </p>
              {result.paybackDays !== Infinity && result.paybackDays <= 30 && (
                <Badge
                  className="border-0 font-medium"
                  style={{
                    background: `${NEON.gain.glow}15`,
                    color: NEON.gain.text,
                    boxShadow: `0 0 12px ${NEON.gain.glow}30`,
                  }}
                >
                  Se paga en {result.paybackDays} días
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
