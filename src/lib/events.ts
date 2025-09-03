// lib/events.ts
import { supabase } from '@/integrations/supabase/client'

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

// Legacy function for backwards compatibility
export async function logServiceEvent(event: string | Record<string, any>, payload?: Record<string, any>) {
  if (typeof event === 'string') {
    return logEvent(event, payload)
  } else {
    return logEvent(event.event_type || 'event', event)
  }
}