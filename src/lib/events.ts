// lib/events.ts
import { supabase } from '@/integrations/supabase/client'

// Allowed event types for service_tracking_events (must match DB constraint)
const ALLOWED_SERVICE_EVENT_TYPES: Record<string, true> = {
  'view': true,
  'click': true,
  'booking': true,
  'purchase': true,
  'assessment_viewed': true,
  'sponsored_impression': true,
  'sponsored_click': true,
  'discount_interest': true,
  'page_view': true,
  'admin_page_view': true,
};

export async function logEvent(name: string, payload?: Record<string, any>) {
  try {
    // Get current session to ensure consistency with RLS policy
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.log('📊 Skipping event log - no authenticated session:', name)
      return
    }

    console.log('📊 Logging event:', name, 'for user:', session.user.id.slice(0, 8))
    
    // Ensure user profile exists before logging event
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle()
    
    if (!profile) {
      console.log('📊 User profile not found, creating profile first for user:', session.user.id.slice(0, 8))
      
      // Try to create a basic profile if it doesn't exist
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: session.user.id,
          display_name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (profileError) {
        console.warn('📊 Could not create profile, logging event without user_id:', profileError.message)
        // Log event without user_id as fallback
        await supabase.from('app_events').insert({ name, payload: payload || null })
        return
      }
    }
    
    const { error } = await supabase.from('app_events').insert({ 
      user_id: session.user.id, 
      name, 
      payload: payload || null 
    })
    
    if (error) {
      console.warn('📊 Event log failed:', error.message, 'for event:', name)
      
      // If still failing, try without user_id
      console.log('📊 Retrying event without user_id:', name)
      await supabase.from('app_events').insert({ name, payload: payload || null })
    } else {
      console.log('📊 Event logged successfully:', name)
    }
  } catch (error) {
    // Silently fail to avoid disrupting user experience
    console.warn('📊 Failed to log event:', name, error)
  }
}

// Enhanced service event logging with validation
export async function logServiceEvent(event: string | Record<string, any>, payload?: Record<string, any>) {
  if (typeof event === 'string') {
    return logEvent(event, payload)
  } else {
    return logEvent(event.event_type || 'event', event)
  }
}

// Safe tracking for service_tracking_events table
export async function trackServiceEvent(data: {
  service_id?: string;
  event_type: string;
  user_id?: string | null;
  metadata?: Record<string, any>;
}) {
  try {
    // Validate event type against allowed list
    const eventType = data.event_type?.trim();
    if (!eventType || !ALLOWED_SERVICE_EVENT_TYPES[eventType]) {
      console.warn('trackServiceEvent(): invalid event_type, skipping', { event_type: eventType });
      return;
    }

    // Only track for authenticated users to prevent 400s
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user && !data.user_id) {
      console.log('trackServiceEvent(): no session, skipping tracking', { event_type: eventType });
      return;
    }

    const payload = {
      service_id: data.service_id || null,
      event_type: eventType,
      user_id: data.user_id || session?.user?.id || null,
      metadata: data.metadata || {},
    };

    // Fire and forget - don't await to avoid blocking UI
    supabase
      .from('service_tracking_events')
      .insert(payload)
      .then(({ error }) => {
        if (error) {
          console.warn('trackServiceEvent(): insert failed', { error: error.message, payload });
        }
      });
      
  } catch (error) {
    console.warn('trackServiceEvent(): failed', { error, data });
  }
}