/**
 * Gate 3 – Transaction helper
 *
 * Typed wrapper for calling Postgres RPC functions via Supabase.
 * Postgres functions are inherently transactional — if the body
 * raises an exception, all writes within the function roll back.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export class TransactionError extends Error {
     constructor(
          public readonly rpcName: string,
          public readonly detail: string
     ) {
          super(`Transaction failed [${rpcName}]: ${detail}`);
          this.name = "TransactionError";
     }
}

/**
 * Call a Postgres RPC function with typed parameters.
 * Throws `TransactionError` on failure so callers get a
 * clean all-or-nothing contract.
 */
export async function callTransactionalRpc<T = unknown>(
     supabase: SupabaseClient,
     fnName: string,
     params: Record<string, unknown>
): Promise<T> {
     const { data, error } = await supabase.rpc(fnName, params);

     if (error) {
          throw new TransactionError(fnName, error.message);
     }

     return data as T;
}

// ---- Typed helpers for each RPC function ----

export type SaveSuppliesBatchParams = {
     p_establishment_id: string;
     p_new_supplies: Array<{
          name: string;
          category: string;
          unit: string;
          current_quantity: number;
          min_threshold?: number;
     }>;
     p_update_supplies: Array<{
          id: string;
          current_quantity: number;
     }>;
};

export type SaveSuppliesBatchResult = {
     inserted: number;
     updated: number;
};

export async function saveSuppliesBatch(
     supabase: SupabaseClient,
     params: SaveSuppliesBatchParams
): Promise<SaveSuppliesBatchResult> {
     return callTransactionalRpc<SaveSuppliesBatchResult>(
          supabase,
          "save_supplies_batch",
          params
     );
}

export type CreateReservationWithLayoutParams = {
     p_establishment_id: string;
     p_table_id: string;
     p_external_id: string;
     p_source: string;
     p_customer_name: string;
     p_customer_phone?: string | null;
     p_customer_email?: string | null;
     p_party_size?: number;
     p_reservation_date?: string;
     p_reservation_time?: string;
     p_notes?: string | null;
     p_special_requests?: string | null;
     p_layout_status?: string;
     p_layout_reservation?: Record<string, unknown> | null;
};

export async function createReservationWithLayout(
     supabase: SupabaseClient,
     params: CreateReservationWithLayoutParams
): Promise<void> {
     await callTransactionalRpc<void>(
          supabase,
          "create_reservation_with_layout",
          params
     );
}

export type UpdateReservationStatusWithLayoutParams = {
     p_external_id: string;
     p_new_status: string;
     p_layout_status?: string | null;
     p_layout_reservation?: Record<string, unknown> | null;
};

export async function updateReservationStatusWithLayout(
     supabase: SupabaseClient,
     params: UpdateReservationStatusWithLayoutParams
): Promise<void> {
     await callTransactionalRpc<void>(
          supabase,
          "update_reservation_status_with_layout",
          params
     );
}
