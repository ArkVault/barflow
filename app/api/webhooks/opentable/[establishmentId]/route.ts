import { createClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/encryption';
import { NextRequest } from 'next/server';
import { isContentLengthTooLarge } from '@/lib/security/request-guards';
import { auditLog } from '@/lib/security/audit-log';
import { isFreshTimestamp } from '@/lib/security/webhook-guards';
import { checkAndStoreReplayKey } from '@/lib/security/webhook-replay-store';

/**
 * OpenTable webhook endpoint - Multi-tenant
 * Each establishment has its own webhook URL
 */
export async function POST(
     req: NextRequest,
     { params }: { params: Promise<{ establishmentId: string }> }
) {
     const { establishmentId } = await params;
     if (isContentLengthTooLarge(req, 256 * 1024)) {
          auditLog('warn', 'opentable_webhook_payload_too_large', { establishmentId });
          return new Response('Payload too large', { status: 413 });
     }

     try {
          // 1. Get integration for this establishment
          const supabase = await createClient();
          const { data: integration, error: integrationError } = await supabase
               .from('opentable_integrations')
               .select('webhook_secret, is_active, opentable_restaurant_id')
               .eq('establishment_id', establishmentId)
               .single();

          if (integrationError || !integration) {
               console.error('Integration not found:', establishmentId);
               return new Response('Integration not found', { status: 404 });
          }

          if (!integration.is_active) {
               console.log('Integration inactive:', establishmentId);
               return new Response('Integration inactive', { status: 403 });
          }

          // 2. Verify webhook signature
          const signature = req.headers.get('x-opentable-signature');
          const timestamp = req.headers.get('x-opentable-timestamp');
          const body = await req.text();

          if (!isFreshTimestamp(timestamp, 300)) {
               auditLog('warn', 'opentable_webhook_stale_timestamp', { establishmentId });
               return new Response('Invalid timestamp', { status: 401 });
          }

          const replay = await checkAndStoreReplayKey({
               source: "opentable",
               replayKey: `${establishmentId}:${timestamp}:${signature ?? 'none'}`,
               ttlSeconds: 600,
               metadata: { establishmentId },
          });
          if (replay.unavailable) {
               return new Response('Replay protection unavailable', { status: 503 });
          }
          if (replay.duplicate) {
               auditLog('warn', 'opentable_webhook_replay_detected', { establishmentId });
               return new Response('Duplicate webhook', { status: 409 });
          }

          if (!verifyWebhookSignature(body, signature, integration.webhook_secret, timestamp)) {
               auditLog('warn', 'opentable_webhook_invalid_signature', { establishmentId });
               return new Response('Invalid signature', { status: 401 });
          }

          const payload = JSON.parse(body);
          console.log('Webhook received:', payload.event_type, 'for', establishmentId);

          // 3. Process event based on type
          await processReservationEvent(supabase, establishmentId, payload);

          // 4. Update last sync time
          await supabase
               .from('opentable_integrations')
               .update({ last_sync_at: new Date().toISOString() })
               .eq('establishment_id', establishmentId);

          return new Response('OK', { status: 200 });

     } catch (error) {
          auditLog('error', 'opentable_webhook_processing_error', { establishmentId });
          return new Response('Internal server error', { status: 500 });
     }
}

/**
 * Process reservation events from OpenTable
 * Gate 3 ACID: multi-table operations use transactional RPC functions
 */
async function processReservationEvent(supabase: any, establishmentId: string, payload: any) {
     const eventType = payload.event_type;
     const data = payload.data;

     // Get table mapping
     const internalTableId = await getInternalTableId(supabase, establishmentId, data.table_id);

     switch (eventType) {
          case 'reservation.created':
               await handleReservationCreated(supabase, establishmentId, internalTableId, data);
               break;

          case 'reservation.updated':
               await handleReservationUpdated(supabase, data);
               break;

          case 'reservation.cancelled':
               await handleReservationCancelled(supabase, data);
               break;

          case 'reservation.seated':
               await handleReservationSeated(supabase, establishmentId, internalTableId, data);
               break;

          case 'reservation.completed':
               await handleReservationCompleted(supabase, data);
               break;

          default:
               console.log('Unhandled event type:', eventType);
     }
}

/**
 * Get internal table ID from OpenTable table ID
 */
async function getInternalTableId(supabase: any, establishmentId: string, openTableTableId: string): Promise<string> {
     const { data: integration } = await supabase
          .from('opentable_integrations')
          .select('id')
          .eq('establishment_id', establishmentId)
          .single();

     if (!integration) return openTableTableId;

     const { data: mapping } = await supabase
          .from('opentable_table_mappings')
          .select('internal_table_id')
          .eq('integration_id', integration.id)
          .eq('opentable_table_id', openTableTableId)
          .single();

     return mapping?.internal_table_id || openTableTableId;
}

/**
 * Handle new reservation created
 * Gate 3 ACID: uses create_reservation_with_layout RPC for atomicity
 */
async function handleReservationCreated(
     supabase: any,
     establishmentId: string,
     tableId: string,
     data: any
) {
     const { error } = await supabase.rpc('create_reservation_with_layout', {
          p_establishment_id: establishmentId,
          p_table_id: tableId,
          p_external_id: data.reservation_id,
          p_source: 'opentable',
          p_customer_name: data.customer?.name || 'Guest',
          p_customer_phone: data.customer?.phone || null,
          p_customer_email: data.customer?.email || null,
          p_party_size: data.party_size,
          p_reservation_date: data.date,
          p_reservation_time: data.time,
          p_notes: data.notes || null,
          p_special_requests: data.special_requests || null,
          p_layout_status: 'reservada',
          p_layout_reservation: {
               source: 'opentable',
               customerName: data.customer?.name || 'Guest',
               time: data.time,
               partySize: data.party_size,
               reservationId: data.reservation_id,
          },
     });

     if (error) {
          console.error('Error in create_reservation_with_layout RPC:', error);
          throw error;
     }

     console.log('Reservation created:', data.reservation_id);
}

/**
 * Handle reservation updated (single-table — no transaction needed)
 */
async function handleReservationUpdated(supabase: any, data: any) {
     await supabase
          .from('reservations')
          .update({
               customer_name: data.customer?.name,
               customer_phone: data.customer?.phone,
               customer_email: data.customer?.email,
               party_size: data.party_size,
               reservation_date: data.date,
               reservation_time: data.time,
               notes: data.notes,
               special_requests: data.special_requests,
          })
          .eq('external_id', data.reservation_id);

     console.log('Reservation updated:', data.reservation_id);
}

/**
 * Handle reservation cancelled
 * Gate 3 ACID: uses update_reservation_status_with_layout RPC for atomicity
 */
async function handleReservationCancelled(supabase: any, data: any) {
     const { error } = await supabase.rpc('update_reservation_status_with_layout', {
          p_external_id: data.reservation_id,
          p_new_status: 'cancelled',
          p_layout_status: 'libre',
          p_layout_reservation: null,
     });

     if (error) {
          console.error('Error in update_reservation_status_with_layout RPC:', error);
          throw error;
     }

     console.log('Reservation cancelled:', data.reservation_id);
}

/**
 * Handle reservation seated (guests arrived)
 * Gate 3 ACID: uses update_reservation_status_with_layout RPC for atomicity
 */
async function handleReservationSeated(
     supabase: any,
     _establishmentId: string,
     _tableId: string,
     data: any
) {
     const { error } = await supabase.rpc('update_reservation_status_with_layout', {
          p_external_id: data.reservation_id,
          p_new_status: 'seated',
          p_layout_status: 'ocupada',
          p_layout_reservation: null,
     });

     if (error) {
          console.error('Error in update_reservation_status_with_layout RPC:', error);
          throw error;
     }

     console.log('Reservation seated:', data.reservation_id);
}

/**
 * Handle reservation completed (single-table — no transaction needed)
 */
async function handleReservationCompleted(supabase: any, data: any) {
     await supabase
          .from('reservations')
          .update({ status: 'completed' })
          .eq('external_id', data.reservation_id);

     console.log('Reservation completed:', data.reservation_id);
}

