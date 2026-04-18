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

// ── Pricing Constants (must mirror PLAN_PRICING in lib/stripe/config.ts) ──

const PRICING = {
  // Single-branch plans
  starter: { yearly: 1_499, monthly: 1_899, baseUsers: 5 },
  business: { yearly: 2_999, monthly: 3_499, baseUsers: 10 },
  // Multi-branch plans
  cadena: {
    yearlyPerBranch: 2_399,
    monthlyPerBranch: 2_999,
    baseUsersPerBranch: 10,
  },
  enterprise: {
    baseFee: 4_500,
    yearlyPerBranch: 1_500,
    monthlyPerBranch: 1_800,
    baseUsers: Infinity,
  },
  // Extra users: blocks of 5 users = $800 MXN/month
  extraUsersBlockSize: 5,
  extraUsersBlockRate: 800,
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
  let baseUsers: number;

  if (branchCount === 1) {
    // Default to Business for single branch (includes AI projections & inventory protection)
    plan = "business";
    baseCost = annualBilling
      ? PRICING.business.yearly
      : PRICING.business.monthly;
    baseUsers = PRICING.business.baseUsers;
  } else if (branchCount <= 5) {
    plan = "cadena";
    // First branch at full price, each additional branch at cadena per-branch rate
    const perBranch = annualBilling
      ? PRICING.cadena.yearlyPerBranch
      : PRICING.cadena.monthlyPerBranch;
    baseCost = perBranch * branchCount;
    baseUsers = PRICING.cadena.baseUsersPerBranch * branchCount;
  } else {
    plan = "enterprise";
    const perBranch = annualBilling
      ? PRICING.enterprise.yearlyPerBranch
      : PRICING.enterprise.monthlyPerBranch;
    baseCost = PRICING.enterprise.baseFee + perBranch * branchCount;
    baseUsers = Infinity;
  }

  const extraUsers = Math.max(0, totalStaff - baseUsers);
  const extraBlocks = Math.ceil(extraUsers / PRICING.extraUsersBlockSize);
  const extraUsersCost =
    extraBlocks === Infinity ? 0 : extraBlocks * PRICING.extraUsersBlockRate;

  return {
    plan,
    baseCost,
    extraUsersCost,
    totalMonthly: baseCost + extraUsersCost,
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
    case "starter":
      return "Starter";
    case "business":
      return "Business";
    case "cadena":
      return "Cadena";
    case "enterprise":
      return "Enterprise";
  }
}
