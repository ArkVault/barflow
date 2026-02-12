/**
 * Canonical Supply type — single source of truth.
 *
 * Core fields that almost every consumer needs are required.
 * Fields that only some views use are optional.
 */
export interface Supply {
     id: string;
     name: string;
     unit: string;
     category: string | null;
     current_quantity: number;
     min_threshold: number;
     cost_per_unit?: number | null;
     supplier?: string | null;
     last_received_date?: string | null;
     optimal_quantity?: number;
     content_per_unit?: number;
     content_unit?: string;
}
