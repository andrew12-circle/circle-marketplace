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
 * Get the base price for copay calculation
 */
export const getCopayBasePrice = (service: any): number => {
  // For verified vendors with pro price, use pro price as base
  if (service.is_verified && service.pro_price) {
    return extractNumericPrice(service.pro_price);
  }
  // Otherwise use retail price as base
  return extractNumericPrice(service.retail_price || '0');
};

/**
 * Calculate potential co-pay price for any service with RESPA split
 */
export const computePotentialCopayForService = (service: any): number => {
  if (!service.respa_split_limit) return 0;
  
  const basePrice = getCopayBasePrice(service);
  return basePrice * (1 - (service.respa_split_limit / 100));
};

/**
 * Calculate potential co-pay price based on pro price and RESPA split limit
 */
export const computePotentialCopay = (proPrice: string, respaSplitLimit: number): number => {
  const proPriceNum = extractNumericPrice(proPrice);
  return proPriceNum * (1 - (respaSplitLimit / 100));
};

/**
 * Calculate potential co-pay price for Non-SSP vendors (potentially better rates)
 */
export const computePotentialCoPayNonSSP = (basePrice: string, service: any): number => {
  const basePriceNum = extractNumericPrice(basePrice);
  const nonSspSplit = service.max_split_percentage_non_ssp || 70; // Default 70% for non-SSP
  return basePriceNum * (1 - (nonSspSplit / 100));
};

/**
 * Calculate discount percentage for a service with all pricing logic
 */
export const computeDiscountPercentage = (service: any): number | null => {
  if (!service.retail_price) return null;
  
  const retailPrice = extractNumericPrice(service.retail_price);
  if (retailPrice <= 0) return null;
  
  // If RESPA split limit exists, calculate copay discount
  if (service.respa_split_limit) {
    let copayPrice: number;
    
    if (service.co_pay_price) {
      copayPrice = extractNumericPrice(service.co_pay_price);
    } else {
      copayPrice = computePotentialCopayForService(service);
    }
    
    if (copayPrice > 0) {
      const percentage = Math.round((copayPrice / retailPrice) * 100);
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
 * Get the display price and label for deals
 */
export const getDealDisplayPrice = (service: any): { price: number; label: string } => {
  // Always prefer Potential Co-Pay when RESPA split limit exists
  if (service.respa_split_limit) {
    let copayPrice: number;
    
    if (service.co_pay_price) {
      copayPrice = extractNumericPrice(service.co_pay_price);
    } else {
      copayPrice = computePotentialCopayForService(service);
    }
    
    if (copayPrice > 0) {
      return { price: copayPrice, label: 'Potential Co-Pay' };
    }
  }
  
  // For verified services with pro price (no copay)
  if (service.is_verified && service.pro_price) {
    const proPrice = extractNumericPrice(service.pro_price);
    return { price: proPrice, label: 'Circle Pro Price' };
  }
  
  // Default to retail price
  const retailPrice = extractNumericPrice(service.retail_price || '0');
  return { price: retailPrice, label: 'Retail Price' };
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