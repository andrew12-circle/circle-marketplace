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

      // Check if returning visitor
      const isReturning = localStorage.getItem('circle_previous_visit') !== null;
      localStorage.setItem('circle_previous_visit', 'true');

      // Detect device and browser info
      const deviceInfo = getDeviceInfo();
      const geoInfo = await getGeoInfo();

      // Create new session with enhanced data
      const { data: session, error } = await supabase
        .from('funnel_sessions')
        .insert({
          anon_id: anonId.current,
          user_id: user?.id || null,
          started_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          referrer_url: document.referrer || null,
          browser_name: deviceInfo.browser_name,
          browser_version: deviceInfo.browser_version,
          os_name: deviceInfo.os_name,
          device_type: deviceInfo.device_type,
          screen_resolution: `${screen.width}x${screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`,
          is_returning_visitor: isReturning,
          country_code: geoInfo.country_code,
          city: geoInfo.city,
          region: geoInfo.region,
          session_metadata: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform
          }
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create analytics session:', error);
        return;
      }

      sessionId.current = session.id;
      isTracking.current = true;

      // Track traffic source
      await trackTrafficSource(session.id);

      // Start heartbeat
      startHeartbeat();
      
      // Track initial page view
      trackPageView();

      // Setup scroll tracking
      setupScrollTracking();

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

  // Get device information
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    let browser_name = 'Unknown';
    let browser_version = '';
    let os_name = 'Unknown';
    let device_type = 'Desktop';

    // Browser detection
    if (userAgent.includes('Chrome')) browser_name = 'Chrome';
    else if (userAgent.includes('Firefox')) browser_name = 'Firefox';
    else if (userAgent.includes('Safari')) browser_name = 'Safari';
    else if (userAgent.includes('Edge')) browser_name = 'Edge';

    // OS detection
    if (userAgent.includes('Windows')) os_name = 'Windows';
    else if (userAgent.includes('Mac')) os_name = 'macOS';
    else if (userAgent.includes('Linux')) os_name = 'Linux';
    else if (userAgent.includes('Android')) os_name = 'Android';
    else if (userAgent.includes('iOS')) os_name = 'iOS';

    // Device type detection
    if (/Mobi|Android/i.test(userAgent)) device_type = 'Mobile';
    else if (/Tablet|iPad/i.test(userAgent)) device_type = 'Tablet';

    return { browser_name, browser_version, os_name, device_type };
  };

  // Get basic geo info (you might want to integrate with a proper service)
  const getGeoInfo = async () => {
    try {
      // This is a placeholder - in production you'd use a real geo IP service
      return {
        country_code: 'US',
        city: 'Unknown',
        region: 'Unknown'
      };
    } catch {
      return {
        country_code: 'Unknown',
        city: 'Unknown',
        region: 'Unknown'
      };
    }
  };

  // Track traffic source
  const trackTrafficSource = async (sessionId: string) => {
    if (!anonId.current) return;

    try {
      const url = new URL(window.location.href);
      const referrer = document.referrer;
      let source_type = 'direct';
      let source_name = null;
      let referrer_domain = null;

      if (referrer) {
        referrer_domain = new URL(referrer).hostname;
        
        // Categorize traffic source
        if (referrer_domain.includes('google')) {
          source_type = 'search';
          source_name = 'google';
        } else if (referrer_domain.includes('facebook')) {
          source_type = 'social';
          source_name = 'facebook';
        } else if (referrer_domain.includes('linkedin')) {
          source_type = 'social';
          source_name = 'linkedin';
        } else if (referrer_domain.includes('twitter') || referrer_domain.includes('x.com')) {
          source_type = 'social';
          source_name = 'twitter';
        } else {
          source_type = 'referral';
        }
      }

      // Check for UTM parameters
      if (url.searchParams.get('utm_source')) {
        source_type = url.searchParams.get('utm_medium') || 'campaign';
        source_name = url.searchParams.get('utm_source');
      }

      await supabase.from('traffic_sources').insert({
        session_id: sessionId,
        anon_id: anonId.current,
        source_type,
        source_name,
        campaign_name: url.searchParams.get('utm_campaign'),
        medium: url.searchParams.get('utm_medium'),
        content: url.searchParams.get('utm_content'),
        term: url.searchParams.get('utm_term'),
        referrer_domain,
        referrer_path: referrer ? new URL(referrer).pathname : null,
        landing_page: location.pathname
      });
    } catch (error) {
      console.error('Traffic source tracking failed:', error);
    }
  };

  // Setup scroll depth tracking
  const setupScrollTracking = () => {
    let scrollDepthMarks = [25, 50, 75, 100];
    let trackedDepths = new Set();
    
    const trackScrollDepth = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = Math.round((scrollTop / docHeight) * 100);

      scrollDepthMarks.forEach(mark => {
        if (scrollPercentage >= mark && !trackedDepths.has(mark) && sessionId.current && anonId.current) {
          trackedDepths.add(mark);
          
          supabase.from('scroll_depth_events').insert({
            session_id: sessionId.current,
            anon_id: anonId.current,
            user_id: user?.id || null,
            page_url: location.pathname,
            page_title: document.title,
            scroll_depth_percentage: mark,
            viewport_height: window.innerHeight,
            page_height: document.documentElement.scrollHeight
          });
          // Handle error separately since supabase doesn't chain promises the same way
          // Error handling is already in place with try/catch in the calling function
        }
      });
    };

    window.addEventListener('scroll', trackScrollDepth, { passive: true });
    return () => window.removeEventListener('scroll', trackScrollDepth);
  };

  // Track conversion events
  const trackConversion = useCallback(async (eventType: string, eventName: string, value: number = 0, metadata: any = {}) => {
    if (!sessionId.current || !anonId.current) return;

    try {
      await supabase.from('conversion_events').insert({
        session_id: sessionId.current,
        anon_id: anonId.current,
        user_id: user?.id || null,
        event_type: eventType,
        event_name: eventName,
        page_url: location.pathname,
        conversion_value: value,
        metadata
      });
    } catch (error) {
      console.error('Conversion tracking failed:', error);
    }
  }, [sessionId, anonId, user?.id, location.pathname]);

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
    trackConversion,
    endSession
  };
}
