// lib/events.ts
import { supabase } from '@/integrations/supabase/client'

export async function logEvent(name: string, payload?: Record<string, any>) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('app_events').insert({ user_id: user.id, name, payload })
  } catch (error) {
    // Silently fail to avoid disrupting user experience
    console.warn('Failed to log event:', error)
  }
}

// Legacy function for backwards compatibility
export async function logServiceEvent(event: string | Record<string, any>, payload?: Record<string, any>) {
  if (typeof event === 'string') {
    return logEvent(event, payload)
  } else {
    return logEvent(event.event_type || 'event', event)
  }
}