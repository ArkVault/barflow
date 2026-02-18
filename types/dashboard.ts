export type UrgencyPeriod = "day" | "week" | "month";
export type UrgencyLevel = "critical" | "warning" | "low";

export interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  totalSalesToday: number;
  monthlyRevenue: number;
}

export interface UrgentSupplyProduct {
  name: string;
  category: string;
  quantityNeeded: number;
}

export interface UrgentSupply {
  id: string;
  name: string;
  current_quantity: number;
  unit: string;
  min_threshold: number;
  category: string;
  daysUntilDepleted: number;
  urgencyLevel: UrgencyLevel;
  products: UrgentSupplyProduct[];
}
