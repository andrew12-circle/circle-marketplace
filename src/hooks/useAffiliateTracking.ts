import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AffiliateTrackingState {
  affiliateCode: string | null;
  attribution: any | null;
  isTracked: boolean;
}

export const useAffiliateTracking = () => {
  const [trackingState, setTrackingState] = useState<AffiliateTrackingState>({
    affiliateCode: null,
    attribution: null,
    isTracked: false
  });
  const { toast } = useToast();

  useEffect(() => {
    // Check URL parameters for affiliate code
    const urlParams = new URLSearchParams(window.location.search);
    const affCode = urlParams.get('aff');
    
    if (affCode) {
      handleAffiliateClick(affCode);
    } else {
      // Check for existing attribution cookie
      const existingAttribution = localStorage.getItem('affiliate_attribution');
      if (existingAttribution) {
        try {
          const attribution = JSON.parse(existingAttribution);
          // Check if attribution is still valid (within 30 days)
          const attributionDate = new Date(attribution.timestamp);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          
          if (attributionDate > thirtyDaysAgo) {
            setTrackingState({
              affiliateCode: attribution.affiliateCode,
              attribution,
              isTracked: true
            });
          } else {
            // Clear expired attribution
            localStorage.removeItem('affiliate_attribution');
          }
        } catch (error) {
          console.error('Error parsing attribution:', error);
          localStorage.removeItem('affiliate_attribution');
        }
      }
    }
  }, []);

  const handleAffiliateClick = async (affiliateCode: string) => {
    try {
      console.log('Tracking affiliate click for code:', affiliateCode);
      
      // Track the click via edge function
      const { data, error } = await supabase.functions.invoke('track-affiliate-click', {
        body: {
          affiliate_code: affiliateCode,
          url: window.location.href,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          utm_source: new URLSearchParams(window.location.search).get('utm_source'),
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
          utm_content: new URLSearchParams(window.location.search).get('utm_content'),
          utm_term: new URLSearchParams(window.location.search).get('utm_term')
        }
      });

      if (error) {
        console.error('Error tracking affiliate click:', error);
        return;
      }

      console.log('Affiliate click tracked successfully:', data);

      // Store attribution in localStorage for 30 days
      const attribution = {
        affiliateCode,
        linkId: data.link_id,
        affiliateId: data.affiliate_id,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('affiliate_attribution', JSON.stringify(attribution));
      
      setTrackingState({
        affiliateCode,
        attribution,
        isTracked: true
      });

      // Clean URL by removing affiliate parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('aff');
      url.searchParams.delete('utm_source');
      url.searchParams.delete('utm_medium');
      url.searchParams.delete('utm_campaign');
      url.searchParams.delete('utm_content');
      url.searchParams.delete('utm_term');
      
      window.history.replaceState({}, document.title, url.toString());

    } catch (error) {
      console.error('Error in affiliate tracking:', error);
    }
  };

  const trackConversion = async (conversionData: {
    conversion_type: 'circle_pro_signup' | 'marketplace_purchase' | 'consultation_booking';
    amount_gross: number;
    order_id?: string;
    subscription_id?: string;
  }) => {
    const attribution = trackingState.attribution;
    
    if (!attribution) {
      console.log('No affiliate attribution found for conversion tracking');
      return null;
    }

    try {
      console.log('Tracking affiliate conversion:', conversionData);

      const { data, error } = await supabase.functions.invoke('track-affiliate-conversion', {
        body: {
          affiliate_id: attribution.affiliateId,
          link_id: attribution.linkId,
          conversion_type: conversionData.conversion_type,
          amount_gross: conversionData.amount_gross,
          order_id: conversionData.order_id,
          subscription_id: conversionData.subscription_id
        }
      });

      if (error) {
        console.error('Error tracking conversion:', error);
        return null;
      }

      console.log('Conversion tracked successfully:', data);

      // Show success notification
      toast({
        title: "Conversion Tracked",
        description: "Affiliate commission has been recorded.",
        variant: "default"
      });

      return data;

    } catch (error) {
      console.error('Error in conversion tracking:', error);
      return null;
    }
  };

  return {
    ...trackingState,
    trackConversion,
    hasActiveAttribution: trackingState.isTracked && trackingState.attribution !== null
  };
};