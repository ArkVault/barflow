/**
 * Stock status calculation utilities
 * Ensures consistent status calculation across the entire app
 */

export type StockStatus = 'ok' | 'low' | 'critical';

export interface SupplyData {
     current_quantity: number;
     optimal_quantity?: number;
     min_threshold: number;
}

/**
 * Calculate stock status based on current quantity vs optimal/minimum threshold
 * 
 * Thresholds:
 * - Critical: 0-30% of optimal
 * - Low: 31-50% of optimal
 * - OK: 51-100% of optimal
 */
export function calculateStockStatus(supply: SupplyData): StockStatus {
     // Use optimal_quantity as reference if available, otherwise use min_threshold
     const referenceQuantity = supply.optimal_quantity && supply.optimal_quantity > 0
          ? supply.optimal_quantity
          : supply.min_threshold;

     const percentage = referenceQuantity > 0
          ? (supply.current_quantity / referenceQuantity) * 100
          : 100;

     // Threshold logic: 0-30% critical, 31-50% low, 51-100% optimal
     if (percentage <= 30) {
          return 'critical';
     } else if (percentage <= 50) {
          return 'low';
     }

     return 'ok';
}

/**
 * Calculate stock percentage for display
 */
export function calculateStockPercentage(supply: SupplyData): number {
     const referenceQuantity = supply.optimal_quantity && supply.optimal_quantity > 0
          ? supply.optimal_quantity
          : supply.min_threshold;

     return referenceQuantity > 0
          ? Math.round((supply.current_quantity / referenceQuantity) * 100)
          : 100;
}

/**
 * Get reference quantity (optimal or minimum)
 */
export function getReferenceQuantity(supply: SupplyData): number {
     return supply.optimal_quantity && supply.optimal_quantity > 0
          ? supply.optimal_quantity
          : supply.min_threshold;
}
