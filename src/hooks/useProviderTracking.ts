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

export const useProviderTracking = (serviceId: string, enabled: boolean = true) => {
  const [metrics, setMetrics] = useState<TrackingMetrics | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const { user } = useAuth();

  // Track an event
  const trackEvent = useCallback(async (event: Omit<TrackingEvent, 'service_id'>) => {
    if (!enabled) return false;
    if (!serviceId) return false;

    try {
      // Use console logging for now until types are updated
      console.log('Tracking event:', {
        serviceId,
        eventType: event.event_type,
        userId: user?.id,
        eventData: event.event_data,
        revenue: event.revenue_attributed
      });

      // Simple console tracking since RPC functions aren't available
      if (event.event_type === 'view') {
        console.log('Service view tracked locally for service:', serviceId);
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
  }, [serviceId, user?.id, enabled]);

  // Load current metrics
  const loadMetrics = useCallback(async () => {
    if (!serviceId) return;

    try {
      // Use mock data for now until types are updated
      const mockMetrics: TrackingMetrics = {
        total_views: 145,
        total_clicks: 23,
        total_bookings: 8,
        total_purchases: 3,
        conversion_rate: 12.5,
        revenue_attributed: 2450,
        last_updated: new Date().toISOString()
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [serviceId]);

  // Track page view automatically
  useEffect(() => {
    if (!enabled) return;
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
  }, [serviceId, trackEvent, loadMetrics, isTracking, enabled]);

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