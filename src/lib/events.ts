import { supabase } from '@/integrations/supabase/client';

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
const ALLOWED_EVENT_TYPES: Record<string, true> = {
  'assessment_viewed': true,
  'assessment_step': true,
  'assessment_completed': true,
  'marketplace_viewed': true,
  'vendor_selected': true,
  'service_viewed': true,
  'sponsored_impression': true,
  'sponsored_click': true,
  'discount_interest': true,
  'view': true,
  'click': true,
  'booking': true,
  'purchase': true
};

function sanitizeEventType(raw?: string): string {
  const eventType = (raw ?? '').trim();
  if (eventType && ALLOWED_EVENT_TYPES[eventType]) {
    return eventType;
  }
  // Fallback to a safe default for unknown event types
  return 'service_viewed';
}

/**
 * Safe event logger that conforms to service_tracking_events schema.
 * - Ensures event_type is present and valid (falls back to event_name)
 * - Guarantees context is an object
 * - Prints detailed error payload on failure
 */
export async function logServiceEvent(evt: ServiceEventInput) {
  const {
    data: userRes,
    error: authErr,
  } = await supabase.auth.getUser();

  const authUserId = userRes?.user?.id ?? null;

  const event_type = sanitizeEventType(evt.event_type ?? evt.event_name);

  const payload = {
    user_id: evt.user_id ?? authUserId, // may be null if not signed in
    event_type,                         // <-- REQUIRED by DB and validated
    page: evt.page ?? null,
    context: evt.context ?? {},         // ensure jsonb object
  };

  if (!event_type) {
    console.warn('logServiceEvent(): event_type missing; skipping insert', { evt });
    return;
  }

  const { error } = await supabase
    .from('service_tracking_events')
    .insert([payload])       // do NOT force ?columns=... in URL
    .select();

  if (error) {
    console.error('service_tracking_events insert failed:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      payload,
    });
  }
}