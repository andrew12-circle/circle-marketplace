// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FacilitatorConfig {
  facilitatorCheckoutEnabled: boolean;
  loading: boolean;
}

export const useFacilitatorConfig = (): FacilitatorConfig => {
  const [facilitatorCheckoutEnabled, setFacilitatorCheckoutEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFacilitatorConfig = async () => {
      try {
        // Check URL parameter for testing
        const urlParams = new URLSearchParams(window.location.search);
        const featureFlagParam = urlParams.get('ff_facilitator_checkout');
        
        if (featureFlagParam === 'on') {
          setFacilitatorCheckoutEnabled(true);
          setLoading(false);
          return;
        }

        // Check database config
        const { data, error } = await supabase
          .from('app_config')
          .select('facilitator_checkout_enabled')
          .single();

        if (error) {
          console.error('Error fetching facilitator config:', error);
          setFacilitatorCheckoutEnabled(false);
        } else {
          setFacilitatorCheckoutEnabled(data?.facilitator_checkout_enabled || false);
        }
      } catch (error) {
        console.error('Error checking facilitator config:', error);
        setFacilitatorCheckoutEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFacilitatorConfig();
  }, []);

  return { facilitatorCheckoutEnabled, loading };
};