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
 * Get the base price for copay calculation (always use retail for RESPA)
 */
export const getCopayBasePrice = (service: any): number => {
  // Always use retail price as base for RESPA split calculations
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
    
    if (copayPrice > 0 && copayPrice < retailPrice) {
      const discountAmount = retailPrice - copayPrice;
      const percentage = Math.round((discountAmount / retailPrice) * 100);
      return percentage > 0 ? percentage : null;
    }
  }
  
  // Fallback: show Circle Pro discount only when verified
  if (service.pro_price && service.is_verified) {
    const proPrice = extractNumericPrice(service.pro_price);
    if (proPrice > 0 && proPrice < retailPrice) {
      const discountAmount = retailPrice - proPrice;
      const percentage = Math.round((discountAmount / retailPrice) * 100);
      return percentage > 0 ? percentage : null;
    }
  }
  
  return null;
};

/**
 * Get the display price and label for deals
 */
export const getDealDisplayPrice = (service: any): { price: number; label: string } => {
  // Always prefer Potential Co-Pay when RESPA split limit exists
  if (service.respa_split_limit) {
    const retailBasedCopay = computePotentialCopayForService(service);
    let copayPrice: number;
    let label: string;
    
    if (service.co_pay_price) {
      const explicitCopay = extractNumericPrice(service.co_pay_price);
      // Validate co_pay_price against retail-based floor
      if (explicitCopay >= retailBasedCopay) {
        copayPrice = explicitCopay;
        label = 'Co-Pay';
      } else {
        // Use retail-based copay if explicit copay is unrealistically low
        copayPrice = retailBasedCopay;
        label = 'Potential Co-Pay';
      }
    } else {
      copayPrice = retailBasedCopay;
      label = 'Potential Co-Pay';
    }
    
    if (copayPrice > 0) {
      return { price: copayPrice, label };
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
 * Get savings info (amount and percentage) for a service
 */
export const getSavingsInfo = (service: any): { amount: number; percentage: number } | null => {
  if (!service.retail_price) return null;
  
  const retailPrice = extractNumericPrice(service.retail_price);
  if (retailPrice <= 0) return null;
  
  const dealInfo = getDealDisplayPrice(service);
  
  if (dealInfo.price >= retailPrice) return null;
  
  const amount = retailPrice - dealInfo.price;
  const percentage = Math.round((amount / retailPrice) * 100);
  
  return percentage > 0 ? { amount, percentage } : null;
};

/**
 * Get the effective price for display (considering membership and copay)
 */
export const getEffectivePrice = (service: any, isProMember: boolean): { price: number; label: string } => {
  // For pro members with copay eligible services, show retail-based potential copay
  if (isProMember && service.is_verified && service.copay_allowed && service.respa_split_limit) {
    const coPayPrice = computePotentialCopayForService(service);
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