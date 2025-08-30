import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type PlacementType = 'top_deals' | 'search_grid' | 'category_entry' | 'vendor_profile';

interface TrackingEvent {
  serviceId: string;
  placement: PlacementType;
  context?: string;
}

export const useSponsoredTracking = () => {
  const { user } = useAuth();

  const trackImpression = useCallback(async ({ serviceId, placement, context }: TrackingEvent) => {
    try {
      // Simple deduplication - check session storage for this service/placement combo
      const key = `sponsored_imp_${serviceId}_${placement}`;
      const lastImpression = sessionStorage.getItem(key);
      const now = Date.now();
      
      // Dedupe impressions within 5 minutes
      if (lastImpression && (now - parseInt(lastImpression)) < 5 * 60 * 1000) {
        return;
      }

      const { error } = await supabase.from('service_tracking_events').insert({
        service_id: serviceId,
        user_id: user?.id || null,
        event_type: 'sponsored_impression',
        event_data: {
          placement,
          context,
          timestamp: now,
          user_agent: navigator.userAgent
        }
      });

      if (!error) {
        sessionStorage.setItem(key, now.toString());
      }
    } catch (error) {
      console.error('Error tracking sponsored impression:', error);
    }
  }, [user?.id]);

  const trackClick = useCallback(async ({ serviceId, placement, context }: TrackingEvent) => {
    try {
      const { error } = await supabase.from('service_tracking_events').insert({
        service_id: serviceId,
        user_id: user?.id || null,
        event_type: 'sponsored_click',
        event_data: {
          placement,
          context,
          timestamp: Date.now(),
          user_agent: navigator.userAgent
        }
      });

      if (error) {
        console.error('Error tracking sponsored click:', error);
      }
    } catch (error) {
      console.error('Error tracking sponsored click:', error);
    }
  }, [user?.id]);

  return {
    trackImpression,
    trackClick
  };
};