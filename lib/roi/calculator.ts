// ── Visor de Utilidad & ROI — Financial Calculation Engine ──

export interface ROIInputs {
  monthlySalesPerBranch: number;
  branchCount: number;
  totalStaff: number;
  annualBilling: boolean;
  shrinkageEnabled: boolean;
}

export interface CostBreakdown {
  shrinkage: number;
  manualManagement: number;
  fragmentedSoftware: number;
  total: number;
}

export interface SubscriptionCost {
  plan: "starter" | "business" | "cadena" | "enterprise";
  baseCost: number;
  extraUsersCost: number;
  totalMonthly: number;
}

export interface ROIResult {
  currentCosts: CostBreakdown;
  subscriptionCost: SubscriptionCost;
  monthlySavings: number;
  paybackDays: number;
  annualSavings: number;
  roiPercentage: number;
}

// ── Pricing Constants (MXN) ──
// Must stay in sync with PLAN_PRICING in lib/stripe/config.ts

const PRICING = {
  starter: {
    yearly: 1_499,
    monthly: 1_899,
    baseUsers: 5,
  },
  business: {
    yearly: 2_999,
    monthly: 3_499,
    baseUsers: 10,
  },
  cadena: {
    // per additional branch (2-5 branches)
    yearlyPerBranch: 2_399,
    monthlyPerBranch: 2_999,
    baseUsersPerBranch: 10,
  },
  enterprise: {
    baseFee: 4_500,
    yearlyPerBranch: 1_500,
    monthlyPerBranch: 1_800,
    baseUsers: Infinity, // unlimited
  },
  extraUsersBlockSize: 5,
  extraUsersBlockRate: 800, // $800 MXN per block of 5 extra users
} as const;

// ── Cost of Disorganization Constants ──

const SHRINKAGE_RATE = 0.15; // 15% average (range 10-30%)
const COGS_RATE = 0.35; // Cost of goods = 35% of gross revenue
const MANAGER_HOURLY_RATE = 125; // MXN/hour for manager/admin
const DAILY_MANAGEMENT_HOURS = 2.5;
const FRAGMENTED_SOFTWARE_COST = 2500; // MXN per branch/month

// ── Calculation Functions ──

export function calculateCurrentCosts(inputs: ROIInputs): CostBreakdown {
  const { monthlySalesPerBranch, branchCount, shrinkageEnabled } = inputs;

  const totalMonthlySales = monthlySalesPerBranch * branchCount;
  const estimatedCOGS = totalMonthlySales * COGS_RATE;

  const shrinkage = shrinkageEnabled ? estimatedCOGS * SHRINKAGE_RATE : 0;
  const manualManagement =
    MANAGER_HOURLY_RATE * DAILY_MANAGEMENT_HOURS * 30 * branchCount;
  const fragmentedSoftware = FRAGMENTED_SOFTWARE_COST * branchCount;

  return {
    shrinkage,
    manualManagement,
    fragmentedSoftware,
    total: shrinkage + manualManagement + fragmentedSoftware,
  };
}

export function calculateSubscriptionCost(inputs: ROIInputs): SubscriptionCost {
  const { branchCount, totalStaff, annualBilling } = inputs;

  let plan: SubscriptionCost["plan"];
  let baseCost: number;
  let baseStaff: number;

  if (branchCount === 1) {
    plan = "single";
    baseCost = annualBilling ? PRICING.single.annual : PRICING.single.monthly;
    baseStaff = PRICING.single.baseStaff;
  } else if (branchCount <= 5) {
    plan = "cadena";
    const base = annualBilling
      ? PRICING.cadena.baseAnnual
      : PRICING.cadena.baseMonthly;
    const additional = annualBilling
      ? PRICING.cadena.additionalAnnual
      : PRICING.cadena.additionalMonthly;
    baseCost = base + additional * (branchCount - 1);
    baseStaff = PRICING.cadena.baseStaff * branchCount;
  } else {
    plan = "enterprise";
    baseCost =
      PRICING.enterprise.baseFee + PRICING.enterprise.perBranch * branchCount;
    baseStaff = Infinity;
  }

  const extraStaff = Math.max(0, totalStaff - baseStaff);
  const extraStaffCost = extraStaff * PRICING.extraStaffRate;

  return {
    plan,
    baseCost,
    extraStaffCost,
    totalMonthly: baseCost + extraStaffCost,
  };
}

export function calculateROI(inputs: ROIInputs): ROIResult {
  const currentCosts = calculateCurrentCosts(inputs);
  const subscriptionCost = calculateSubscriptionCost(inputs);

  const monthlySavings = currentCosts.total - subscriptionCost.totalMonthly;
  const annualSavings = monthlySavings * 12;

  const paybackDays =
    monthlySavings > 0
      ? Math.ceil((subscriptionCost.totalMonthly / currentCosts.total) * 30)
      : Infinity;

  const roiPercentage =
    subscriptionCost.totalMonthly > 0
      ? (monthlySavings / subscriptionCost.totalMonthly) * 100
      : 0;

  return {
    currentCosts,
    subscriptionCost,
    monthlySavings,
    paybackDays,
    annualSavings,
    roiPercentage,
  };
}

export function formatMXN(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getPlanLabel(plan: SubscriptionCost["plan"]): string {
  switch (plan) {
    case "single":
      return "Bar Sucursal";
    case "cadena":
      return "Cadena Flowstock";
    case "enterprise":
      return "Enterprise";
  }
}
