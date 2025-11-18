import type { SupplyPlan, PlanPeriod } from "./default-supplies";

export interface UserPlan {
  supplies: SupplyPlan[];
  period: PlanPeriod;
}

// Get user's configured plan from localStorage
export function getUserPlan(): UserPlan | null {
  if (typeof window === "undefined") return null;
  
  const planData = localStorage.getItem("barflow_plan");
  if (!planData) return null;
  
  try {
    return JSON.parse(planData);
  } catch {
    return null;
  }
}

// Generate consistent random value based on supply name (for demo consistency)
function getConsistentRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 100) / 100;
}

// Convert user plan to urgent supplies format with dynamic urgency calculation
export function convertPlanToSupplies(plan: UserPlan) {
  const { supplies, period } = plan;
  
  return supplies
    .filter(s => s.selected)
    .map((supply, index) => {
      const max_quantity = supply.quantity; // La cantidad configurada es el máximo
      
      // Usar hash del nombre para generar consumo consistente (entre 30% y 95%)
      const seedValue = getConsistentRandom(supply.name + supply.category);
      const consumptionRate = 0.3 + (seedValue * 0.65);
      const current_quantity = max_quantity * consumptionRate;
      
      // Calcular días hasta agotarse basado en el periodo y el consumo
      let daysUntilDepleted: number;
      const baseConsumptionPerDay = max_quantity / (period === 'week' ? 7 : 30);
      daysUntilDepleted = Math.max(1, Math.floor(current_quantity / baseConsumptionPerDay));
      
      // Calcular urgencia basada en quintas partes del máximo
      const ratio = current_quantity / max_quantity;
      let urgencyLevel: 'critical' | 'warning' | 'low' = 'low';
      
      if (ratio <= 0.4) urgencyLevel = 'critical';
      else if (ratio <= 0.6) urgencyLevel = 'warning';
      else urgencyLevel = 'low';
      
      return {
        id: `supply-${index}`,
        name: supply.name,
        category: supply.category,
        current_quantity: Math.round(current_quantity * 100) / 100,
        min_threshold: max_quantity,
        unit: supply.unit,
        daysUntilDepleted,
        urgencyLevel,
        products: [] // Podemos agregar productos relacionados después
      };
    });
}

// Get supplies filtered by current view period (día/semana/mes)
export function getSuppliesByViewPeriod(
  planSupplies: ReturnType<typeof convertPlanToSupplies>,
  viewPeriod: 'day' | 'week' | 'month'
) {
  return planSupplies.filter(supply => {
    if (viewPeriod === 'day') {
      return supply.daysUntilDepleted <= 3;
    } else if (viewPeriod === 'week') {
      return supply.daysUntilDepleted <= 10;
    } else {
      return true; // month shows all
    }
  });
}
