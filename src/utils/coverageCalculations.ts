/**
 * Marketing Coverage Calculation Utilities
 * Handles dual coverage logic for SSP and Non-SSP vendors
 */

export interface CoverageResult {
  ssp: {
    pct: number;
    agentPays: number | null;
  };
  nonSsp: {
    pct: number;
    agentPays: number | null;
  };
}

/**
 * Computes marketing coverage for both SSP and Non-SSP vendors
 * @param basePrice - The base price of the service
 * @param sspPct - SSP percentage (0-100)
 * @param nonPct - Non-SSP percentage (0-100)
 * @param sspAllowed - Whether SSP coverage is allowed
 * @returns Coverage calculation results
 */
export function computeCoverage(
  basePrice: number, 
  sspPct?: number | null, 
  nonPct?: number | null, 
  sspAllowed?: boolean
): CoverageResult {
  // Handle SSP coverage
  const sspEffective = sspAllowed === false ? 0 : Math.max(0, Math.min(100, sspPct ?? 0));
  
  // Handle Non-SSP coverage
  const nonEffective = Math.max(0, Math.min(100, nonPct ?? 0));
  
  // Clamp function for rounding
  const clamp = (n: number) => Math.round(n);

  return {
    ssp: {
      pct: sspEffective,
      agentPays: sspEffective > 0 ? clamp(basePrice * (1 - sspEffective / 100)) : null
    },
    nonSsp: {
      pct: nonEffective,
      agentPays: nonEffective > 0 ? clamp(basePrice * (1 - nonEffective / 100)) : null
    }
  };
}

/**
 * Formats coverage amount for display
 * @param amount - The amount to format
 * @returns Formatted string with currency
 */
export function formatCoverageAmount(amount: number | null): string {
  if (amount === null) return "Not eligible";
  return `$${amount.toFixed(2)}`;
}

/**
 * Gets the base price from service pricing data
 * @param service - Service object with pricing information
 * @returns Base price for coverage calculations
 */
export function getBasePriceForCoverage(service: any): number {
  // Use pro_price if available, otherwise retail_price
  const proPrice = parseFloat(service.pro_price?.replace(/[^\d.]/g, '') || '0');
  const retailPrice = parseFloat(service.retail_price?.replace(/[^\d.]/g, '') || '0');
  
  return proPrice > 0 ? proPrice : retailPrice;
}