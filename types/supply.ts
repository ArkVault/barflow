export type SupplyStatus = "ok" | "low" | "critical";

export interface Supply {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_quantity: number;
  min_threshold: number;
  optimal_quantity?: number;
  content_per_unit?: number;
  content_unit?: string;
  cost_per_unit?: number | null;
  supplier?: string | null;
  last_received_date?: string | null;
}

export interface SupplyWithStatus extends Supply {
  status: SupplyStatus;
}
