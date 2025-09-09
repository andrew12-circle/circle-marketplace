import { extractNumericPrice } from './dealPricing';

/**
 * Shared pricing logic that matches ServiceCard behavior
 * This ensures consistency between TopDealsCarousel and ServiceCard
 */

/**
 * Calculate co-pay price using ServiceCard's logic:
 * - If verified: use pro_price as base for RESPA split
 * - If not verified: use retail_price as base for RESPA split
 */
export const calculateCopayPrice = (service: any): number => {
  if (!service.respa_split_limit) return 0;
  
  const basePrice = service.is_verified && service.pro_price
    ? extractNumericPrice(service.pro_price)
    : extractNumericPrice(service.retail_price || '0');
    
  return basePrice * (1 - (service.respa_split_limit / 100));
};

/**
 * Get the unified display price and label that matches ServiceCard
 */
export const getUnifiedDisplayPrice = (service: any): { price: number; label: string } => {
  // Priority 1: Co-pay when available and allowed
  if (service.copay_allowed && service.respa_split_limit) {
    const copayPrice = calculateCopayPrice(service);
    if (copayPrice > 0) {
      return { price: copayPrice, label: 'Co-Pay Available' };
    }
  }
  
  // Priority 2: Circle Pro price for verified services
  if (service.is_verified && service.pro_price) {
    const proPrice = extractNumericPrice(service.pro_price);
    return { price: proPrice, label: 'Circle Pro Price' };
  }
  
  // Priority 3: Retail price
  const retailPrice = extractNumericPrice(service.retail_price || '0');
  return { price: retailPrice, label: 'Retail Price' };
};

/**
 * Calculate savings compared to retail price
 */
export const calculateSavings = (service: any): { amount: number; percentage: number } | null => {
  const retailPrice = extractNumericPrice(service.retail_price || '0');
  if (retailPrice <= 0) return null;
  
  const displayInfo = getUnifiedDisplayPrice(service);
  
  if (displayInfo.price >= retailPrice) return null;
  
  const amount = retailPrice - displayInfo.price;
  const percentage = Math.round((amount / retailPrice) * 100);
  
  return percentage > 0 ? { amount, percentage } : null;
};