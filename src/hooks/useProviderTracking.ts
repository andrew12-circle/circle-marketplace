import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TrackingEvent {
  event_type: 'view' | 'click' | 'booking' | 'purchase' | 'conversion';
  service_id: string;
  vendor_id?: string;
  event_data?: Record<string, any>;
  revenue_attributed?: number;
}

interface TrackingMetrics {
  total_views: number;
  total_clicks: number;
  total_bookings: number;
  total_purchases: number;
  conversion_rate: number;
  revenue_attributed: number;
  last_updated: string;
}

export const useProviderTracking = (serviceId: string) => {
  const [metrics, setMetrics] = useState<TrackingMetrics | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const { user } = useAuth();

  // Track an event
  const trackEvent = useCallback(async (event: Omit<TrackingEvent, 'service_id'>) => {
    if (!serviceId) return;

    try {
      // Use existing content_engagement_events table for tracking
      const { error } = await supabase
        .from('content_engagement_events')
        .insert({
          content_id: serviceId,
          user_id: user?.id,
          event_type: event.event_type,
          creator_id: event.vendor_id || '00000000-0000-0000-0000-000000000001',
          engagement_quality_score: 1.0,
          revenue_attributed: event.revenue_attributed || 0,
          event_data: {
            ...event.event_data,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            referrer: document.referrer,
            url: window.location.href
          }
        });

      if (error) {
        console.error('Error tracking event:', error);
        return false;
      }

      // Update metrics if needed
      if (event.event_type === 'purchase' || event.event_type === 'booking') {
        await loadMetrics();
      }

      return true;
    } catch (error) {
      console.error('Error tracking event:', error);
      return false;
    }
  }, [serviceId, user?.id]);

  // Load current metrics
  const loadMetrics = useCallback(async () => {
    if (!serviceId) return;

    try {
      // Use existing content_engagement_events for metrics
      const { data, error } = await supabase
        .from('content_engagement_events')
        .select('*')
        .eq('content_id', serviceId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const events = data || [];
      const views = events.filter(e => e.event_type === 'view').length;
      const bookings = events.filter(e => e.event_type === 'booking').length;
      const purchases = events.filter(e => e.event_type === 'purchase').length;
      const clicks = events.filter(e => e.event_type === 'click').length;
      const revenue = events.reduce((sum, e) => sum + (e.revenue_attributed || 0), 0);

      const metrics: TrackingMetrics = {
        total_views: views,
        total_clicks: clicks,
        total_bookings: bookings,
        total_purchases: purchases,
        conversion_rate: views > 0 ? ((bookings + purchases) / views) * 100 : 0,
        revenue_attributed: revenue,
        last_updated: new Date().toISOString()
      };

      setMetrics(metrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [serviceId]);

  // Track page view automatically
  useEffect(() => {
    if (serviceId && !isTracking) {
      setIsTracking(true);
      trackEvent({
        event_type: 'view',
        event_data: {
          source: 'service_funnel'
        }
      });
      loadMetrics();
    }
  }, [serviceId, trackEvent, loadMetrics, isTracking]);

  // Track outbound link clicks
  const trackOutboundClick = useCallback(async (url: string, context?: string) => {
    await trackEvent({
      event_type: 'click',
      event_data: {
        url,
        context: context || 'outbound_link',
        click_type: 'external'
      }
    });
  }, [trackEvent]);

  // Track booking events
  const trackBooking = useCallback(async (bookingData: any) => {
    await trackEvent({
      event_type: 'booking',
      event_data: {
        booking_id: bookingData.id,
        booking_type: bookingData.type || 'consultation',
        value: bookingData.value || 0
      }
    });
  }, [trackEvent]);

  // Track purchase events
  const trackPurchase = useCallback(async (purchaseData: any) => {
    await trackEvent({
      event_type: 'purchase',
      event_data: {
        purchase_id: purchaseData.id,
        package_type: purchaseData.package_type,
        payment_method: purchaseData.payment_method
      },
      revenue_attributed: purchaseData.amount || 0
    });
  }, [trackEvent]);

  // Track conversion events
  const trackConversion = useCallback(async (conversionData: any) => {
    await trackEvent({
      event_type: 'conversion',
      event_data: {
        conversion_type: conversionData.type,
        conversion_value: conversionData.value,
        funnel_step: conversionData.step
      },
      revenue_attributed: conversionData.revenue || 0
    });
  }, [trackEvent]);

  return {
    metrics,
    trackEvent,
    trackOutboundClick,
    trackBooking,
    trackPurchase,
    trackConversion,
    loadMetrics,
    isTracking
  };
};