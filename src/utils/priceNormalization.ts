/**
 * Price normalization utilities for admin service editing
 * Handles currency formatting and ensures clean numeric values for database storage
 */

/**
 * Normalizes a price value by stripping all non-numeric characters except decimals
 * @param value - Price value that may contain currency symbols, commas, etc.
 * @returns Clean numeric value or null for empty/invalid inputs
 */
export const normalizePrice = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // If already a number, validate it
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? null : value;
  }
  
  // Strip all non-numeric characters except decimal points
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  
  if (cleaned === '' || cleaned === '-') {
    return null;
  }
  
  const parsed = parseFloat(cleaned);
  
  // Return null for invalid numbers (NaN, Infinity, negative values)
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
    return null;
  }
  
  // Round to 2 decimal places for currency
  return Math.round(parsed * 100) / 100;
};

/**
 * Validates that a price normalization won't result in NaN
 * @param value - Value to check
 * @returns true if the value will normalize to a valid number or null
 */
export const isValidPriceInput = (value: any): boolean => {
  const normalized = normalizePrice(value);
  return normalized === null || (typeof normalized === 'number' && !isNaN(normalized));
};

/**
 * Debug helper to log price transformation
 * @param label - Description of the price field
 * @param original - Original value
 * @param normalized - Normalized value
 */
export const dlogPriceTransform = (label: string, original: any, normalized: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PriceNormalization] ${label}:`, {
      original,
      type: typeof original,
      normalized,
      valid: !isNaN(normalized)
    });
  }
};