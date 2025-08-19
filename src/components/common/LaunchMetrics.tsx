import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Launch metrics tracking for 9/1 launch
export const LaunchMetrics = () => {
  const { user } = useAuth();

  const trackEvent = async (eventType: string, eventData?: Record<string, any>) => {
    try {
      if (!user) return;
      
      await supabase.from('launch_metrics').insert([{
        user_id: user.id,
        event_type: eventType,
        event_data: eventData || {},
        created_at: new Date().toISOString()
      }]);
    } catch (error) {
      // Silent fail for metrics
      console.debug('Metrics tracking failed:', error);
    }
  };

  // Track page views
  useEffect(() => {
    const path = window.location.pathname;
    trackEvent('page_view', { path });
  }, []);

  // Track user engagement
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      const link = target.closest('a');
      
      if (button) {
        trackEvent('button_click', { 
          button_text: button.textContent?.trim(),
          button_class: button.className 
        });
      } else if (link) {
        trackEvent('link_click', { 
          link_href: link.href,
          link_text: link.textContent?.trim() 
        });
      }
    };

    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 75) {
        trackEvent('deep_scroll', { scroll_percent: scrollPercent });
      }
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [user]);

  return null; // This is a tracking-only component
};

// Key metrics to track for launch success
export const trackLaunchMetric = async (metricType: 'conversion' | 'engagement' | 'error', data: Record<string, any>) => {
  try {
    await supabase.from('launch_metrics').insert([{
      event_type: `launch_${metricType}`,
      event_data: data,
      created_at: new Date().toISOString()
    }]);
  } catch (error) {
    console.debug('Launch metric tracking failed:', error);
  }
};