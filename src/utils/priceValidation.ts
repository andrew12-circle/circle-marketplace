// Price validation and safeguards for ecommerce platform
import { supabase } from '@/integrations/supabase/client';

export interface PriceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedPrice: number | null;
}

export interface PriceAuditLog {
  service_id: string;
  old_price: number | null;
  new_price: number;
  price_type: 'retail' | 'pro' | 'co_pay';
  changed_by: string;
  reason: string;
  timestamp: Date;
}

// Price validation rules
const PRICE_RULES = {
  MIN_PRICE: 0.01,
  MAX_PRICE: 100000,
  MAX_DISCOUNT_PERCENTAGE: 95,
  SUSPICIOUS_PRICE_THRESHOLD: 10000, // Flag prices above this
  DECIMAL_PLACES: 2
};

/**
 * Comprehensive price validation with multiple safeguards
 */
export const validatePrice = (
  priceInput: string | number, 
  priceType: 'retail' | 'pro' | 'co_pay',
  existingPrice?: number
): PriceValidationResult => {
  const result: PriceValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    sanitizedPrice: null
  };

  // Step 1: Input sanitization and parsing
  let numericPrice: number;
  
  if (typeof priceInput === 'string') {
    // Remove all non-numeric characters except decimal point
    const cleanedInput = priceInput.replace(/[^\d.]/g, '');
    numericPrice = parseFloat(cleanedInput);
  } else {
    numericPrice = priceInput;
  }

  // Step 2: Basic validation
  if (isNaN(numericPrice) || !isFinite(numericPrice)) {
    result.isValid = false;
    result.errors.push('Invalid price format - must be a valid number');
    return result;
  }

  // Step 3: Range validation
  if (numericPrice < PRICE_RULES.MIN_PRICE) {
    result.isValid = false;
    result.errors.push(`Price must be at least $${PRICE_RULES.MIN_PRICE}`);
  }

  if (numericPrice > PRICE_RULES.MAX_PRICE) {
    result.isValid = false;
    result.errors.push(`Price cannot exceed $${PRICE_RULES.MAX_PRICE.toLocaleString()}`);
  }

  // Step 4: Decimal places validation
  const decimalPlaces = (numericPrice.toString().split('.')[1] || '').length;
  if (decimalPlaces > PRICE_RULES.DECIMAL_PLACES) {
    numericPrice = parseFloat(numericPrice.toFixed(PRICE_RULES.DECIMAL_PLACES));
    result.warnings.push(`Price rounded to ${PRICE_RULES.DECIMAL_PLACES} decimal places`);
  }

  // Step 5: Suspicious price detection
  if (numericPrice > PRICE_RULES.SUSPICIOUS_PRICE_THRESHOLD) {
    result.warnings.push('High price detected - requires admin approval');
  }

  // Step 6: Price relationship validation
  if (existingPrice && priceType === 'pro') {
    if (numericPrice >= existingPrice) {
      result.warnings.push('Pro price should typically be lower than retail price');
    }
  }

  // Step 7: Dramatic price change detection
  if (existingPrice && Math.abs(numericPrice - existingPrice) / existingPrice > 0.5) {
    result.warnings.push('Price change exceeds 50% - requires verification');
  }

  result.sanitizedPrice = numericPrice;
  return result;
};

/**
 * Extract and validate price from various input formats
 */
export const extractAndValidatePrice = (priceString: string, priceType: 'retail' | 'pro' | 'co_pay'): PriceValidationResult => {
  // More robust regex that handles various price formats
  const priceRegex = /(?:\$|USD|CAD)?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/;
  const match = priceString.match(priceRegex);
  
  if (!match) {
    return {
      isValid: false,
      errors: ['Could not extract valid price from string'],
      warnings: [],
      sanitizedPrice: null
    };
  }

  const extractedPrice = match[1].replace(/,/g, '');
  return validatePrice(extractedPrice, priceType);
};

/**
 * Log price changes for audit trail (requires price_audit_logs table)
 */
export const logPriceChange = async (auditData: PriceAuditLog): Promise<void> => {
  try {
    // For now, log to console - implement database logging when table is created
    console.log('Price Change Audit:', {
      serviceId: auditData.service_id,
      oldPrice: auditData.old_price,
      newPrice: auditData.new_price,
      priceType: auditData.price_type,
      changedBy: auditData.changed_by,
      reason: auditData.reason,
      timestamp: auditData.timestamp.toISOString()
    });
  } catch (error) {
    console.error('Error logging price change:', error);
  }
};

/**
 * Validate price relationships across different tiers
 */
export const validatePriceHierarchy = (
  retailPrice?: string,
  proPrice?: string,
  coPayPrice?: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const retail = retailPrice ? extractAndValidatePrice(retailPrice, 'retail').sanitizedPrice : null;
  const pro = proPrice ? extractAndValidatePrice(proPrice, 'pro').sanitizedPrice : null;
  const coPay = coPayPrice ? extractAndValidatePrice(coPayPrice, 'co_pay').sanitizedPrice : null;

  // Validate price hierarchy: Retail >= Pro and Co-pay calculated from Pro price
  if (retail && pro && pro > retail) {
    errors.push('Pro price cannot be higher than retail price');
  }

  // Co-pay should be calculated from pro price, not validated separately
  // If co-pay is manually set, ensure it's derived from pro price with vendor split
  if (pro && coPay) {
    // Allow some tolerance for rounding differences
    const expectedCoPay = pro * 0.5; // Assuming 50% vendor split as example
    const tolerance = 0.01;
    if (Math.abs(coPay - expectedCoPay) > tolerance && coPay > pro) {
      errors.push('Co-pay price should be calculated from pro price with vendor split percentage');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Safe price formatter with validation
 */
export const safeFormatPrice = (
  price: number | string,
  currency: 'USD' | 'CAD' = 'USD',
  locale: string = 'en-US'
): string => {
  try {
    const validation = validatePrice(price, 'retail');
    
    if (!validation.isValid || validation.sanitizedPrice === null) {
      console.error('Invalid price for formatting:', price, validation.errors);
      return 'Price Error';
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(validation.sanitizedPrice);
  } catch (error) {
    console.error('Error formatting price:', error);
    return 'Format Error';
  }
};

/**
 * Price integrity check for cart operations
 */
export const validateCartPricing = async (serviceId: string, clientPrice: number): Promise<boolean> => {
  try {
    const { data: service, error } = await supabase
      .from('services')
      .select('retail_price, pro_price, co_pay_price')
      .eq('id', serviceId)
      .maybeSingle();

    if (error || !service) {
      console.error('Failed to fetch service for price validation:', error);
      return false;
    }

    // Check if client price matches any of the valid server prices
    const validPrices = [
      service.retail_price,
      service.pro_price,
      service.co_pay_price
    ].filter(Boolean).map(price => {
      const validation = extractAndValidatePrice(price, 'retail');
      return validation.sanitizedPrice;
    });

    return validPrices.includes(clientPrice);
  } catch (error) {
    console.error('Error validating cart pricing:', error);
    return false;
  }
};