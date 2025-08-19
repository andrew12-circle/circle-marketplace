import { Crown, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrency } from "@/hooks/useCurrency";

interface MobilePricingDisplayProps {
  service: {
    id: string;
    retail_price?: string;
    pro_price?: string;
    copay_allowed?: boolean;
    respa_split_limit?: number;
    is_verified?: boolean;
    price_duration?: string;
  };
  isProMember: boolean;
  extractNumericPrice: (price: string) => number;
  onCoPayClick?: () => void;
}

export const MobilePricingDisplay = ({ 
  service, 
  isProMember, 
  extractNumericPrice,
  onCoPayClick 
}: MobilePricingDisplayProps) => {
  const { formatPrice } = useCurrency();

  const retailPrice = service.retail_price ? extractNumericPrice(service.retail_price) : 0;
  const proPrice = service.pro_price ? extractNumericPrice(service.pro_price) : 0;
  const coPayAmount = service.respa_split_limit && isProMember && service.is_verified
    ? Math.round(proPrice * (service.respa_split_limit / 100))
    : service.respa_split_limit && !isProMember 
    ? Math.round(retailPrice * (service.respa_split_limit / 100))
    : 0;

  return (
    <div className="space-y-3">
      {/* Main Price Display - Optimized for mobile */}
      <div className="text-center space-y-2">
        {isProMember && service.is_verified && service.pro_price ? (
          // Pro Member - Show Pro Price Prominently
          <>
            {service.retail_price && (
              <div className="text-sm text-muted-foreground">
                <span className="line-through">
                  Retail: {formatPrice(retailPrice, service.price_duration || 'mo')}
                </span>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-blue-600">
              <Crown className="w-5 h-5" />
              <span>{formatPrice(proPrice, service.price_duration || 'mo')}</span>
            </div>
            <div className="text-xs text-blue-600 font-medium">Circle Pro Price</div>
          </>
        ) : (
          // Regular Member - Show Retail Price
          <div className="text-2xl font-bold text-foreground">
            {formatPrice(retailPrice, service.price_duration || 'mo')}
          </div>
        )}
      </div>

      {/* Co-Pay Option - Prominent Mobile Display */}
      {service.copay_allowed && service.respa_split_limit && coPayAmount > 0 && (
        <div 
          className="bg-green-50 border-2 border-green-200 rounded-lg p-3 cursor-pointer hover:bg-green-100 transition-colors"
          onClick={onCoPayClick}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-lg font-bold text-green-700 mb-1">
              <span>Co-Pay Available</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Eligible agents can have up to {service.respa_split_limit}% of the service cost covered by the vendor through our RESPA-compliant co-marketing program.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-green-600 font-medium">
              Your potential cost: {formatPrice(
                (isProMember && service.is_verified ? proPrice : retailPrice) - coPayAmount,
                service.price_duration || 'mo'
              )}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Up to {formatPrice(coPayAmount, service.price_duration || 'mo')} vendor contribution
            </div>
          </div>
        </div>
      )}

      {/* Savings Indicator */}
      {isProMember && service.is_verified && service.pro_price && service.retail_price && (
        <div className="text-center">
          <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
            <span>Save {formatPrice(retailPrice - proPrice, service.price_duration || 'mo')}</span>
            <span>({Math.round(((retailPrice - proPrice) / retailPrice) * 100)}% off)</span>
          </div>
        </div>
      )}
    </div>
  );
};