
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FunnelEvent {
  event_name: string;
  page_url?: string;
  referrer_url?: string;
  metadata?: Record<string, any>;
}

export const useFunnelTracking = () => {
  const { user } = useAuth();
  const anonIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Generate or retrieve anonymous ID
  useEffect(() => {
    let anonId = localStorage.getItem('funnel_anon_id');
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem('funnel_anon_id', anonId);
    }
    anonIdRef.current = anonId;
  }, []);

  // Create session on first load
  useEffect(() => {
    if (!anonIdRef.current) return;

    const createSession = async () => {
      try {
        const { data, error } = await supabase
          .from('funnel_sessions')
          .insert({
            anon_id: anonIdRef.current,
            user_id: user?.id || null,
            landing_page: window.location.pathname,
            referrer: document.referrer || null,
            utm_source: new URLSearchParams(window.location.search).get('utm_source'),
            utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
            utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
            device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
          })
          .select('id')
          .single();

        if (data) {
          sessionIdRef.current = data.id;
        }
      } catch (error) {
        console.error('Error creating funnel session:', error);
      }
    };

    createSession();
  }, [user?.id]);

  // Link anonymous events to user after authentication
  useEffect(() => {
    if (user && anonIdRef.current) {
      const linkEvents = async () => {
        try {
          await supabase.rpc('link_funnel_events', {
            p_anon_id: anonIdRef.current
          });
        } catch (error) {
          console.error('Error linking funnel events:', error);
        }
      };
      linkEvents();
    }
  }, [user]);

  const trackEvent = async (event: FunnelEvent) => {
    if (!anonIdRef.current) return;

    try {
      await supabase
        .from('funnel_events')
        .insert({
          session_id: sessionIdRef.current,
          anon_id: anonIdRef.current,
          user_id: user?.id || null,
          event_name: event.event_name,
          page_url: event.page_url || window.location.pathname,
          referrer_url: event.referrer_url || document.referrer || null,
          metadata: event.metadata || {},
        });
    } catch (error) {
      console.error('Error tracking funnel event:', error);
    }
  };

  return { trackEvent };
};
