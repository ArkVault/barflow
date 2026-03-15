export type { Supply, SupplyStatus, SupplyWithStatus } from "./supply";
export type {
  DashboardStats,
  UrgentSupply,
  UrgentSupplyProduct,
  UrgencyLevel,
  UrgencyPeriod,
} from "./dashboard";

export interface Product {
  id?: string;
  name: string;
  price: number;
  category?: string;
  menu_id?: string;
  establishment_id: string;
  is_active?: boolean;
  image_url?: string;
  [key: string]: unknown;
}

export interface MenuData {
  id?: string;
  name: string;
  establishment_id: string;
  is_active?: boolean;
  is_secondary_active?: boolean;
  [key: string]: unknown;
}
