import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WebAnalyticsConfig {
  enabled?: boolean;
  heartbeatInterval?: number;
  clickThrottleMs?: number;
}

export function useWebAnalyticsTracking(config: WebAnalyticsConfig = {}) {
  const { 
    enabled = true, 
    heartbeatInterval = 30000, // 30 seconds
    clickThrottleMs = 500 
  } = config;
  
  const { user } = useAuth();
  const location = useLocation();
  
  const sessionId = useRef<string | null>(null);
  const anonId = useRef<string | null>(null);
  const currentPageView = useRef<string | null>(null);
  const heartbeatInterval_ = useRef<NodeJS.Timeout | null>(null);
  const lastClickTime = useRef<number>(0);
  const isTracking = useRef<boolean>(false);

  // Initialize or get existing session
  const initializeSession = useCallback(async () => {
    if (!enabled || isTracking.current) return;

    try {
      // Get or create anonymous ID
      let storedAnonId = localStorage.getItem('circle_anon_id');
      if (!storedAnonId) {
        storedAnonId = crypto.randomUUID();
        localStorage.setItem('circle_anon_id', storedAnonId);
      }
      anonId.current = storedAnonId;

      // Create new session
      const { data: session, error } = await supabase
        .from('funnel_sessions')
        .insert({
          anon_id: anonId.current,
          user_id: user?.id || null,
          started_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          referrer_url: document.referrer || null
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create analytics session:', error);
        return;
      }

      sessionId.current = session.id;
      isTracking.current = true;

      // Start heartbeat
      startHeartbeat();
      
      // Track initial page view
      trackPageView();

    } catch (error) {
      console.error('Analytics initialization failed:', error);
    }
  }, [enabled, user?.id]);

  // Start heartbeat to keep session alive
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval_.current) {
      clearInterval(heartbeatInterval_.current);
    }

    heartbeatInterval_.current = setInterval(async () => {
      if (sessionId.current) {
        try {
          await supabase.rpc('touch_session', { p_session_id: sessionId.current });
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  // End session
  const endSession = useCallback(async () => {
    if (!sessionId.current) return;

    try {
      // End current page view
      if (currentPageView.current) {
        await supabase
          .from('page_views')
          .update({ exited_at: new Date().toISOString() })
          .eq('id', currentPageView.current);
      }

      // End session
      await supabase.rpc('end_session', { p_session_id: sessionId.current });
      
      // Clear heartbeat
      if (heartbeatInterval_.current) {
        clearInterval(heartbeatInterval_.current);
        heartbeatInterval_.current = null;
      }

      sessionId.current = null;
      currentPageView.current = null;
      isTracking.current = false;
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, []);

  // Track page view
  const trackPageView = useCallback(async () => {
    if (!sessionId.current || !anonId.current) return;

    try {
      // End previous page view
      if (currentPageView.current) {
        await supabase
          .from('page_views')
          .update({ exited_at: new Date().toISOString() })
          .eq('id', currentPageView.current);
      }

      // Create new page view
      const url = new URL(window.location.href);
      const { data: pageView, error } = await supabase
        .from('page_views')
        .insert({
          session_id: sessionId.current,
          anon_id: anonId.current,
          user_id: user?.id || null,
          page_url: location.pathname,
          page_title: document.title,
          referrer_url: document.referrer || null,
          utm_source: url.searchParams.get('utm_source'),
          utm_medium: url.searchParams.get('utm_medium'),
          utm_campaign: url.searchParams.get('utm_campaign'),
          metadata: {
            hostname: window.location.hostname,
            search: window.location.search
          }
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to track page view:', error);
        return;
      }

      currentPageView.current = pageView.id;
    } catch (error) {
      console.error('Page view tracking failed:', error);
    }
  }, [location.pathname, user?.id]);

  // Track click events
  const trackClick = useCallback(async (event: MouseEvent) => {
    if (!sessionId.current || !anonId.current || !enabled) return;

    const now = Date.now();
    if (now - lastClickTime.current < clickThrottleMs) return;
    lastClickTime.current = now;

    const target = event.target as Element;
    if (!target) return;

    // Skip noisy elements
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    try {
      // Generate CSS selector
      const selector = generateSelector(target);
      const text = target.textContent?.trim().substring(0, 100) || '';

      await supabase
        .from('click_events')
        .insert({
          session_id: sessionId.current,
          anon_id: anonId.current,
          user_id: user?.id || null,
          page_url: location.pathname,
          element_selector: selector,
          element_text: text,
          click_x: event.clientX,
          click_y: event.clientY,
          metadata: {
            target_tag: target.tagName,
            target_type: target.getAttribute('type'),
            href: target.getAttribute('href')
          }
        });
    } catch (error) {
      console.error('Click tracking failed:', error);
    }
  }, [sessionId, anonId, enabled, clickThrottleMs, location.pathname, user?.id]);

  // Generate CSS selector for element
  const generateSelector = (element: Element): string => {
    if (element.id) return `#${element.id}`;
    
    let selector = element.tagName.toLowerCase();
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c && !c.startsWith('_'));
      if (classes.length > 0) {
        selector += '.' + classes.slice(0, 2).join('.');
      }
    }
    
    // Add position if no unique identifier
    if (!element.id && !element.className) {
      const parent = element.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(element);
        selector += `:nth-child(${index + 1})`;
      }
    }
    
    return selector;
  };

  // Effect to handle route changes
  useEffect(() => {
    if (!enabled || !isTracking.current) return;
    trackPageView();
  }, [location.pathname, trackPageView, enabled]);

  // Effect to initialize session
  useEffect(() => {
    if (enabled) {
      initializeSession();
    }

    return () => {
      if (heartbeatInterval_.current) {
        clearInterval(heartbeatInterval_.current);
      }
    };
  }, [enabled, initializeSession]);

  // Effect to handle page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable tracking on page unload
      if (sessionId.current && navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/end-session', JSON.stringify({
          sessionId: sessionId.current,
          pageViewId: currentPageView.current
        }));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        endSession();
      } else if (document.visibilityState === 'visible' && !isTracking.current) {
        initializeSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', trackClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', trackClick, true);
      endSession();
    };
  }, [enabled, endSession, initializeSession, trackClick]);

  return {
    sessionId: sessionId.current,
    anonId: anonId.current,
    isTracking: isTracking.current,
    trackPageView,
    endSession
  };
}
