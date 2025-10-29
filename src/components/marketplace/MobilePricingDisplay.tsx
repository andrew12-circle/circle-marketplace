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
    max_split_percentage_non_ssp?: number;
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
  const basePrice = isProMember && service.is_verified ? proPrice : retailPrice;
  
  const sspPct = service.respa_split_limit || 0;
  const nonSspPct = service.max_split_percentage_non_ssp || 0;
  
  const sspAgentPays = sspPct > 0 ? basePrice * (1 - sspPct / 100) : null;
  const nonSspAgentPays = nonSspPct > 0 ? basePrice * (1 - nonSspPct / 100) : null;

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

      {/* Circle Match Option - Compact Mobile Display */}
      {service.copay_allowed && (sspAgentPays !== null || nonSspAgentPays !== null) && (
        <div 
          className="bg-green-50 border-2 border-green-200 rounded-lg p-2.5 cursor-pointer hover:bg-green-100 transition-colors"
          onClick={onCoPayClick}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-green-700">
              <span>Circle Match Available</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Partner with vendors who help cover service costs. SSP vendors (lenders/title) typically {sspPct}%, Non-SSP vendors up to {nonSspPct}%.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="space-y-1">
              {sspAgentPays !== null && (
                <div className="bg-white p-1.5 rounded border border-green-300">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-600">SSP (Lenders/Title):</span>
                    <span className="font-bold text-green-700 text-sm">
                      {formatPrice(sspAgentPays, service.price_duration || 'mo')}
                    </span>
                  </div>
                </div>
              )}
              
              {nonSspAgentPays !== null && (
                <div className="bg-white p-1.5 rounded border border-blue-300">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-600">Non-SSP (Others):</span>
                    <span className="font-bold text-blue-700 text-sm">
                      {formatPrice(nonSspAgentPays, service.price_duration || 'mo')}
                    </span>
                  </div>
                </div>
              )}
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