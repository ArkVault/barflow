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
 */
async function handleReservationCreated(
     supabase: any,
     establishmentId: string,
     tableId: string,
     data: any
) {
     // Create reservation record
     await supabase.from('reservations').insert({
          establishment_id: establishmentId,
          table_id: tableId,
          external_id: data.reservation_id,
          source: 'opentable',
          customer_name: data.customer?.name || 'Guest',
          customer_phone: data.customer?.phone,
          customer_email: data.customer?.email,
          party_size: data.party_size,
          reservation_date: data.date,
          reservation_time: data.time,
          status: 'confirmed',
          notes: data.notes,
          special_requests: data.special_requests,
     });

     // Update table status in operations_layout
     await updateTableReservationStatus(supabase, establishmentId, tableId, {
          status: 'reservada',
          reservation: {
               source: 'opentable',
               customerName: data.customer?.name || 'Guest',
               time: data.time,
               partySize: data.party_size,
               reservationId: data.reservation_id,
          },
     });

     console.log('Reservation created:', data.reservation_id);
}

/**
 * Handle reservation updated
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
 */
async function handleReservationCancelled(supabase: any, data: any) {
     // Update reservation status
     await supabase
          .from('reservations')
          .update({ status: 'cancelled' })
          .eq('external_id', data.reservation_id);

     // Get reservation to find table
     const { data: reservation } = await supabase
          .from('reservations')
          .select('establishment_id, table_id')
          .eq('external_id', data.reservation_id)
          .single();

     if (reservation) {
          // Clear table reservation status
          await updateTableReservationStatus(supabase, reservation.establishment_id, reservation.table_id, {
               status: 'libre',
               reservation: null,
          });
     }

     console.log('Reservation cancelled:', data.reservation_id);
}

/**
 * Handle reservation seated (guests arrived)
 */
async function handleReservationSeated(
     supabase: any,
     establishmentId: string,
     tableId: string,
     data: any
) {
     // Update reservation status
     await supabase
          .from('reservations')
          .update({ status: 'seated' })
          .eq('external_id', data.reservation_id);

     // Update table to occupied
     await updateTableReservationStatus(supabase, establishmentId, tableId, {
          status: 'ocupada',
          reservation: null, // Clear reservation details once seated
     });

     console.log('Reservation seated:', data.reservation_id);
}

/**
 * Handle reservation completed
 */
async function handleReservationCompleted(supabase: any, data: any) {
     await supabase
          .from('reservations')
          .update({ status: 'completed' })
          .eq('external_id', data.reservation_id);

     console.log('Reservation completed:', data.reservation_id);
}

/**
 * Update table reservation status in operations_layout
 */
async function updateTableReservationStatus(
     supabase: any,
     establishmentId: string,
     tableId: string,
     update: { status: string; reservation: any }
) {
     // Get current layout
     const { data: layout } = await supabase
          .from('operations_layout')
          .select('sections')
          .eq('establishment_id', establishmentId)
          .single();

     if (!layout) return;

     // Update table in sections
     const updatedSections = layout.sections.map((section: any) => ({
          ...section,
          tables: section.tables.map((table: any) =>
               table.id === tableId
                    ? { ...table, status: update.status, reservation: update.reservation }
                    : table
          ),
     }));

     // Save updated layout
     await supabase
          .from('operations_layout')
          .update({ sections: updatedSections })
          .eq('establishment_id', establishmentId);
}
