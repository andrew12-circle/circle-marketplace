import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ServiceEvent = {
  event_name: string;
  page?: string;
  context?: Record<string, any>;
}

export async function logServiceEvent(evt: ServiceEvent) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.warn('Failed to get user for event logging:', userError);
    }
    
    const user_id = user?.id ?? null;

    const payload = {
      user_id,                       // uuid or null
      event_name: evt.event_name,    // text NOT NULL
      page: evt.page ?? null,        // text nullable
      context: evt.context ?? {},    // jsonb NOT NULL default {}
    };

    const { error } = await supabase
      .from('service_tracking_events')
      .insert([payload])
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
  } catch (e) {
    console.error('logServiceEvent threw', e);
  }
}

// Custom hook to log assessment view only once per session
export function useLogAssessmentViewOnce(page: string) {
  const { toast } = useToast();
  
  return {
    logView: () => {
      // Check if we've already logged this session
      const sessionKey = `assessment_logged_${page}`;
      if (sessionStorage.getItem(sessionKey)) {
        return; // Already logged this session
      }
      
      // Log the event
      logServiceEvent({ 
        event_name: 'assessment_viewed', 
        page,
        context: {
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        }
      });
      
      // Mark as logged for this session
      sessionStorage.setItem(sessionKey, 'true');
    }
  };
}