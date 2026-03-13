/**
 * Gate 4 – Shared DTO schemas and types for API boundaries.
 *
 * Zod schemas serve as the single source of truth:
 *  - Runtime validation at API boundaries (routes, webhooks)
 *  - Static TypeScript types via z.infer<>
 *
 * Convention: every schema is named <Entity>Schema,
 *             every inferred type is named <Entity>DTO.
 */

import { z } from "zod";

// ============================================================
// Quotes
// ============================================================

export const QuoteRequestSchema = z.object({
     name: z.string().min(1, "Name is required"),
     email: z.string().email("Invalid email"),
     phone: z.string().min(1, "Phone is required"),
     businessName: z.string().optional(),
     branches: z.union([z.string(), z.number()]).transform(String),
     message: z.string().optional(),
});

export type QuoteRequestDTO = z.infer<typeof QuoteRequestSchema>;

// ============================================================
// Stripe Checkout
// ============================================================

export const CheckoutRequestSchema = z.object({
     priceId: z.string().min(1, "priceId is required"),
     userId: z.string().uuid("Invalid userId"),
     userEmail: z.string().email().optional(),
     establishmentId: z.string().uuid().optional(),
});

export type CheckoutRequestDTO = z.infer<typeof CheckoutRequestSchema>;

// ============================================================
// OpenTable Webhook Payloads
// ============================================================

const OpenTableCustomerSchema = z.object({
     name: z.string().optional(),
     phone: z.string().optional(),
     email: z.string().optional(),
});

const OpenTableReservationDataSchema = z.object({
     reservation_id: z.string(),
     table_id: z.string().optional(),
     customer: OpenTableCustomerSchema.optional(),
     party_size: z.number().int().positive().optional().default(1),
     date: z.string().optional(),
     time: z.string().optional(),
     notes: z.string().optional(),
     special_requests: z.string().optional(),
});

export const OpenTableWebhookPayloadSchema = z.object({
     event_type: z.enum([
          "reservation.created",
          "reservation.updated",
          "reservation.cancelled",
          "reservation.seated",
          "reservation.completed",
     ]),
     data: OpenTableReservationDataSchema,
});

export type OpenTableWebhookPayloadDTO = z.infer<typeof OpenTableWebhookPayloadSchema>;
export type OpenTableReservationDataDTO = z.infer<typeof OpenTableReservationDataSchema>;

// ============================================================
// Menu Parse (AI-assisted supply parsing)
// ============================================================

export const ParsedSupplyItemSchema = z.object({
     name: z.string().min(1).default("Unknown"),
     quantity: z.number().positive().default(1),
     unit: z.string().min(1).default("units"),
     category: z.string().min(1).default("Otros"),
     matched_existing: z.boolean().default(false),
     existing_id: z.string().uuid().nullable().optional(),
     confidence: z.number().min(0).max(1).default(0),
});

export const ParsedSupplyResponseSchema = z.array(ParsedSupplyItemSchema);

export type ParsedSupplyItemDTO = z.infer<typeof ParsedSupplyItemSchema>;

// ============================================================
// Establishment (used by Stripe webhook handlers)
// ============================================================

export type EstablishmentLookupResult = {
     id: string;
     user_id: string;
};

// ============================================================
// Supabase client type alias (replaces `supabase: any`)
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";

export type AppSupabaseClient = SupabaseClient;
