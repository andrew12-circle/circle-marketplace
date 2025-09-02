import { supabase } from '@/integrations/supabase/client';
import { waitForSession } from '@/lib/session-gate';
import { devError } from '@/lib/dev-logger';

export type ServiceEventInput = {
  /** Required logically, maps to DB NOT NULL event_type */
  event_type?: string;
  /** Back-compat: some callers still send event_name; map it */
  event_name?: string;
  page?: string | null;
  context?: Record<string, any> | null;
  user_id?: string | null; // pass explicitly if you already have it
}

// Whitelist of allowed event types to prevent CHECK constraint violations
const ALLOWED_EVENT_TYPES = new Set([
  'assessment_viewed',
  'assessment_step', 
  'assessment_completed',
  'marketplace_viewed',
  'vendor_selected',
  'sponsored_impression',
  'sponsored_click',
  'discount_interest',
  'view',
  'click',
  'booking',
  'purchase',
  'service_viewed'
]);

type ServiceEvent = {
  event_type: string;
  page?: string | null;
  context?: Record<string, any> | null;
  user_id?: string | null;
}

const eventQueue: ServiceEvent[] = [];
let flushing = false;

function sanitizeEventType(rawType?: string): string {
  const eventType = (rawType ?? '').trim();
  return ALLOWED_EVENT_TYPES.has(eventType) ? eventType : 'service_viewed';
}

async function flushEventQueue() {
  if (flushing || eventQueue.length === 0) return;
  
  flushing = true;
  try {
    const userId = await waitForSession(3000); // 3 second timeout
    
    if (!userId) {
      // No session established; drop queued events silently for this session
      devError('No session available for event logging, dropping', eventQueue.length, 'events');
      eventQueue.length = 0;
      return;
    }

    // Process queue in batches
    const batchSize = 10;
    while (eventQueue.length > 0) {
      const batch = eventQueue.splice(0, batchSize);
      
      const payloads = batch.map(evt => ({
        user_id: evt.user_id || userId,
        event_type: sanitizeEventType(evt.event_type),
        page: evt.page ?? null,
        context: evt.context ?? {}
      }));

      const { error } = await supabase
        .from('service_tracking_events')
        .insert(payloads)
        .select();

      if (error) {
        devError('service_tracking_events batch insert failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          batchSize: payloads.length
        });
        // Don't retry failed events to avoid infinite loops
      }
    }
  } catch (error) {
    devError('Exception during event queue flush:', error);
    // Clear queue on exception to prevent buildup
    eventQueue.length = 0;
  } finally {
    flushing = false;
  }
}

/**
 * Safe event logger that waits for session and conforms to service_tracking_events schema.
 * - Queues events until session is available
 * - Ensures event_type is valid (sanitizes unknown types)
 * - Handles batch processing for efficiency
 * - Gracefully handles failures without blocking
 */
export async function logServiceEvent(evt: ServiceEventInput) {
  const event_type = evt.event_type ?? evt.event_name ?? '';
  
  if (!event_type.trim()) {
    devError('logServiceEvent(): event_type missing; skipping', { evt });
    return;
  }

  // Add to queue
  eventQueue.push({
    event_type,
    page: evt.page,
    context: evt.context,
    user_id: evt.user_id
  });

  // Trigger flush (fire and forget)
  void flushEventQueue();
}