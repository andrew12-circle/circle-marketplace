import { parsePrice } from './parsePrice';
import { extractAndValidatePrice } from './priceValidation';

/**
 * Safely extract numeric price with validation
 */
export const extractNumericPrice = (priceString: string): number => {
  const validation = extractAndValidatePrice(priceString, 'retail');
  if (!validation.isValid || validation.sanitizedPrice === null) {
    console.error('Price validation failed:', priceString, validation.errors);
    return 0;
  }
  return validation.sanitizedPrice;
};

/**
 * Calculate potential co-pay price based on pro price and RESPA split limit
 */
export const computePotentialCopay = (proPrice: string, respaSplitLimit: number): number => {
  const proPriceNum = extractNumericPrice(proPrice);
  return proPriceNum * (1 - (respaSplitLimit / 100));
};

/**
 * Calculate discount percentage for a service with all pricing logic
 */
export const computeDiscountPercentage = (service: any): number | null => {
  if (!service.retail_price) return null;
  
  const retailPrice = extractNumericPrice(service.retail_price);
  if (retailPrice <= 0) return null;
  
  // Unverified: discount equals RESPA split limit off retail
  if (!service.is_verified && service.respa_split_limit) {
    return service.respa_split_limit;
  }
  
  // Verified: prefer potential co-pay discount if available
  if (service.copay_allowed && service.respa_split_limit) {
    if (service.pro_price) {
      const potential = computePotentialCopay(service.pro_price, service.respa_split_limit);
      const percentage = Math.round((potential / retailPrice) * 100);
      return 100 - percentage;
    } else if (service.co_pay_price) {
      const coPayPrice = extractNumericPrice(service.co_pay_price);
      const percentage = Math.round((coPayPrice / retailPrice) * 100);
      return 100 - percentage;
    }
  }
  
  // Fallback: show Circle Pro discount only when verified
  if (service.pro_price && service.is_verified) {
    const proPrice = extractNumericPrice(service.pro_price);
    const percentage = Math.round((proPrice / retailPrice) * 100);
    return 100 - percentage;
  }
  
  return null;
};

/**
 * Get the effective price for display (considering membership and copay)
 */
export const getEffectivePrice = (service: any, isProMember: boolean): { price: number; label: string } => {
  // For pro members with copay eligible services, show potential copay
  if (isProMember && service.is_verified && service.copay_allowed && service.pro_price && service.respa_split_limit) {
    const coPayPrice = computePotentialCopay(service.pro_price, service.respa_split_limit);
    return { price: coPayPrice, label: 'Potential Co-Pay' };
  }
  
  // For pro members with verified services, show pro price
  if (isProMember && service.is_verified && service.pro_price) {
    const proPrice = extractNumericPrice(service.pro_price);
    return { price: proPrice, label: 'Circle Pro Price' };
  }
  
  // Default to retail price
  const retailPrice = extractNumericPrice(service.retail_price || '0');
  return { price: retailPrice, label: 'Retail Price' };
};