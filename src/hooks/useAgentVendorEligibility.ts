// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAgentVendorEligibility = (vendorId: string) => {
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsEligible(true); // Allow unauthenticated users to see pricing
          setLoading(false);
          return;
        }

        // Call the check_agent_vendor_match function
        const { data, error } = await supabase.rpc('check_agent_vendor_match', {
          p_agent_id: user.id,
          p_vendor_id: vendorId
        });

        if (error) {
          console.error('Error checking agent eligibility:', error);
          setIsEligible(true); // Default to eligible on error
        } else {
          setIsEligible(data);
        }
      } catch (error) {
        console.error('Error checking agent eligibility:', error);
        setIsEligible(true); // Default to eligible on error
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      checkEligibility();
    }
  }, [vendorId]);

  return { isEligible, loading };
};