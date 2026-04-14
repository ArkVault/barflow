"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

// ── Animated Bar Component ──

function ComparisonBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: "rose" | "emerald";
}) {
  const percentage = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  const bgClass = color === "rose" ? "bg-rose-500" : "bg-emerald-500";
  const textClass = color === "rose" ? "text-rose-400" : "text-emerald-400";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${textClass}`}>{formatMXN(value)}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted/30 overflow-hidden">
        <div
          className={`h-full rounded-full ${bgClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ── KPI Card ──

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
  accent: "emerald" | "rose" | "amber";
}) {
  const accentMap = {
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    amber: "text-amber-400",
  };

  return (
    <div className="neumorphic-inset p-4 rounded-xl space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accentMap[accent]}`} />
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className={`text-2xl font-bold ${accentMap[accent]}`}>{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

// ── Value Prop Checklist ──

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Blindaje DNA-Stock",
    description: "Reducción de merma del 30% a menos de 5%",
    metric: 83, // % reduction
  },
  {
    icon: MousePointerClick,
    title: "Cierres en 1 Click",
    description: "Automatización total de inventario vs ventas",
    metric: 95, // % automation
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
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Visor de Utilidad & ROI</h2>
          <p className="text-sm text-muted-foreground">
            Descubre cómo Flowstock se paga solo eliminando ineficiencias
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Column 1: Inputs ── */}
        <Card className="neumorphic border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Simulador de Ahorro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Sliders */}
            <div className="space-y-6">
              {/* Monthly Sales */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Ventas Mensuales por Sucursal
                  </Label>
                  <Badge variant="outline" className="font-mono text-sm">
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
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$50K</span>
                  <span>$1M</span>
                </div>
              </div>

              {/* Branch Count */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Número de Sucursales
                  </Label>
                  <Badge variant="outline" className="font-mono text-sm">
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
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>15</span>
                </div>
              </div>

              {/* Staff */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Staff Total
                  </Label>
                  <Badge variant="outline" className="font-mono text-sm">
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
                <div className="flex justify-between text-xs text-muted-foreground">
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
                <Label className="text-sm">
                  Pago Anual
                  {annualBilling && (
                    <span className="ml-1.5 text-emerald-400 text-xs font-medium">
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
                <Label className="text-sm">Cálculo de Mermas</Label>
              </div>
            </div>

            {/* ── Comparative Visualizer ── */}
            <div className="space-y-5 pt-2">
              {/* Side A: Current Costs (Red) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wide">
                    Fuga de Capital Actual
                  </h3>
                </div>
                <div className="neumorphic-inset p-4 rounded-xl space-y-3">
                  {shrinkageEnabled && (
                    <ComparisonBar
                      label="Mermas / Robo"
                      value={result.currentCosts.shrinkage}
                      maxValue={maxBarValue}
                      color="rose"
                    />
                  )}
                  <ComparisonBar
                    label="Gestión Manual (horas admin)"
                    value={result.currentCosts.manualManagement}
                    maxValue={maxBarValue}
                    color="rose"
                  />
                  <ComparisonBar
                    label="Software Fragmentado"
                    value={result.currentCosts.fragmentedSoftware}
                    maxValue={maxBarValue}
                    color="rose"
                  />
                  <div className="border-t border-muted/30 pt-2 flex justify-between text-sm font-bold">
                    <span>Total Pérdida Mensual</span>
                    <span className="text-rose-400">
                      {formatMXN(result.currentCosts.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Side B: Our Solution (Green) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">
                    Inversión Administrador Digital
                  </h3>
                </div>
                <div className="neumorphic-inset p-4 rounded-xl space-y-3">
                  <ComparisonBar
                    label={`Plan ${getPlanLabel(result.subscriptionCost.plan)}`}
                    value={result.subscriptionCost.baseCost}
                    maxValue={maxBarValue}
                    color="emerald"
                  />
                  {result.subscriptionCost.extraStaffCost > 0 && (
                    <ComparisonBar
                      label="Staff adicional"
                      value={result.subscriptionCost.extraStaffCost}
                      maxValue={maxBarValue}
                      color="emerald"
                    />
                  )}
                  <div className="border-t border-muted/30 pt-2 flex justify-between text-sm font-bold">
                    <span>Total Inversión Mensual</span>
                    <span className="text-emerald-400">
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
                accent={result.monthlySavings > 0 ? "emerald" : "rose"}
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
                accent={result.paybackDays <= 15 ? "emerald" : "amber"}
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
                accent={result.roiPercentage > 100 ? "emerald" : "amber"}
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
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <prop.icon className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{prop.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {prop.description}
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={prop.metric}
                    className="h-1.5 [&>div]:bg-emerald-500"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick savings summary card */}
          <Card className="neumorphic border-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="text-3xl font-bold text-emerald-400">
                {result.monthlySavings > 0
                  ? formatMXN(result.monthlySavings)
                  : formatMXN(0)}
              </div>
              <p className="text-sm text-muted-foreground">
                ahorro neto mensual estimado
              </p>
              {result.paybackDays !== Infinity && result.paybackDays <= 30 && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
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
