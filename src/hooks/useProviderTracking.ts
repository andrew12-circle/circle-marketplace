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

export const useProviderTracking = (serviceId: string, enabled: boolean = true, auto: boolean = true) => {
  const [metrics, setMetrics] = useState<TrackingMetrics | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const { user } = useAuth();

  // Track an event
  const trackEvent = useCallback(async (event: Omit<TrackingEvent, 'service_id'>) => {
    if (!enabled) return false;
    if (!serviceId) return false;

    try {
      // Persist event to Supabase
      const { error } = await supabase.from('service_tracking_events').insert({
        service_id: serviceId,
        vendor_id: (event as any).vendor_id || null,
        user_id: user?.id || null,
        event_type: event.event_type,
        event_data: event.event_data || {},
        revenue_attributed: event.revenue_attributed || 0
      });

      if (error) throw error;

      // Refresh metrics for revenue-impacting events
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
      // Load real metrics via RPC
      const { data, error } = await supabase.rpc('get_service_tracking_metrics', {
        p_service_id: serviceId,
        p_time_period: '30d'
      });

      if (error) throw error;

      const m = (data as any) || {};
      const mapped = {
        total_views: m.total_views ?? 0,
        total_clicks: m.total_clicks ?? 0,
        total_bookings: m.total_bookings ?? 0,
        total_purchases: m.total_purchases ?? 0,
        conversion_rate: m.conversion_rate ?? 0,
        revenue_attributed: m.revenue_attributed ?? 0,
        last_updated: m.last_updated ?? new Date().toISOString()
      } as TrackingMetrics;

      setMetrics(mapped);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [serviceId]);

  // Track page view automatically with de-dup (15 min TTL)
  useEffect(() => {
    if (!enabled || !auto) return;
    if (serviceId && !isTracking) {
      const key = `svc_view_${serviceId}`;
      const last = typeof sessionStorage !== 'undefined' ? Number(sessionStorage.getItem(key) || 0) : 0;
      const now = Date.now();
      const fifteenMin = 15 * 60 * 1000;

      setIsTracking(true);
      if (!last || now - last > fifteenMin) {
        trackEvent({
          event_type: 'view',
          event_data: { source: 'service_funnel', dedup: true }
        });
        try { sessionStorage.setItem(key, String(now)); } catch {}
      }
      loadMetrics();
    }
  }, [serviceId, trackEvent, loadMetrics, isTracking, enabled, auto]);

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

  // Track website click-through with referral token and open in new tab
  const trackWebsiteClick = useCallback(async (rawUrl: string, vendorId?: string, context: string = 'vendor_website') => {
    try {
      const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      let finalUrl = normalized;

      // Mint referral token if user is logged in and vendorId provided
      if (user?.id && vendorId) {
        const { data: token, error: tokenError } = await supabase.rpc('mint_referral_token', {
          p_user_id: user.id,
          p_vendor_id: vendorId,
          p_service_id: serviceId
        });
        if (!tokenError && token) {
          const u = new URL(normalized);
          u.searchParams.set('ref', String(token));
          finalUrl = u.toString();
        }
      }

      await trackEvent({
        event_type: 'click',
        event_data: { url: finalUrl, context, click_type: 'external' },
        revenue_attributed: 0,
        vendor_id: vendorId
      } as any);

      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Error tracking website click:', e);
      // Fallback open
      const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      window.open(normalized, '_blank', 'noopener,noreferrer');
    }
  }, [trackEvent, user?.id, supabase, serviceId]);

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
    trackWebsiteClick,
    trackBooking,
    trackPurchase,
    trackConversion,
    loadMetrics,
    isTracking
  };
};