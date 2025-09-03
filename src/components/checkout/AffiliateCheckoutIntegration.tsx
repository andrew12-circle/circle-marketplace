import { useEffect } from "react";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useToast } from "@/hooks/use-toast";

interface AffiliateCheckoutIntegrationProps {
  orderId?: string;
  subscriptionId?: string;
  amount: number;
  conversionType: 'circle_pro_signup' | 'marketplace_purchase' | 'consultation_booking';
  onConversionTracked?: (data: any) => void;
}

export const AffiliateCheckoutIntegration = ({
  orderId,
  subscriptionId,
  amount,
  conversionType,
  onConversionTracked
}: AffiliateCheckoutIntegrationProps) => {
  const { trackConversion, hasActiveAttribution } = useAffiliateTracking();
  const { toast } = useToast();

  useEffect(() => {
    if (hasActiveAttribution && amount > 0) {
      handleConversionTracking();
    }
  }, [hasActiveAttribution, amount, conversionType]);

  const handleConversionTracking = async () => {
    try {
      const conversionData = await trackConversion({
        conversion_type: conversionType,
        amount_gross: amount,
        order_id: orderId,
        subscription_id: subscriptionId
      });

      if (conversionData && onConversionTracked) {
        onConversionTracked(conversionData);
      }

      console.log('Affiliate conversion tracked:', conversionData);
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  };

  // This component doesn't render anything visible
  return null;
};