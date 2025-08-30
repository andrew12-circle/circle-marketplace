// @ts-nocheck
import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Options {
  auto?: boolean;
  dedupeMinutes?: number;
}

export const useServiceViewTracker = (
  serviceId?: string,
  options: Options = {}
) => {
  const { user } = useAuth();
  const { auto = false, dedupeMinutes = 15 } = options;

  const storageKey = serviceId ? `svc_view_${serviceId}` : undefined;

  const shouldTrack = () => {
    if (!storageKey) return false;
    try {
      const last = sessionStorage.getItem(storageKey);
      if (!last) return true;
      const lastTs = parseInt(last, 10);
      return Date.now() - lastTs > dedupeMinutes * 60 * 1000;
    } catch {
      return true;
    }
  };

  const trackView = useCallback(async () => {
    if (!serviceId) return;
    try {
      if (!shouldTrack()) return;
      const { error } = await supabase.from('service_views').insert({
        service_id: serviceId,
        user_id: user?.id || null,
        ip_address: null,
        user_agent: navigator.userAgent,
        referrer_url: document.referrer || null,
      });
      if (error) {
        console.error('Error tracking service view:', error);
        return;
      }
      if (storageKey) {
        sessionStorage.setItem(storageKey, String(Date.now()));
      }
    } catch (err) {
      console.error('Error tracking service view:', err);
    }
  }, [serviceId, user?.id]);

  useEffect(() => {
    if (auto) {
      trackView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  return { trackView };
};
