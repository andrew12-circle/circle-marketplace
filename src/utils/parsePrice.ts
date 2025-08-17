/**
 * Shared utility for parsing prices consistently across the application
 */
export const parsePrice = (price: any): number => {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    // Remove all non-numeric characters except decimal points and hyphens
    const cleanedPrice = price.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleanedPrice);
    return isNaN(parsed) ? 0 : Math.abs(parsed); // Return absolute value to handle negative signs
  }
  return 0;
};