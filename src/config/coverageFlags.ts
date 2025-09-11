/**
 * Feature flags for marketing coverage display logic
 */

// When true, only show coverage when matching vendors are available
export const SHOW_COVERAGE_ONLY_WHEN_MATCHED = false;

/**
 * Determines if coverage should be displayed based on vendor availability
 * @param service - Service object with coverage configuration
 * @param vendors - Available vendors array
 * @returns Whether coverage block should be displayed
 */
export function isCoverageDisplayable(service: any, vendors: any[] = []): boolean {
  if (!SHOW_COVERAGE_ONLY_WHEN_MATCHED) {
    return true; // Always show when flag is disabled
  }

  // Check if we have SSP vendors and SSP coverage is configured
  const hasSSPCoverage = (service.max_split_percentage_ssp ?? 0) > 0 && 
    vendors.some(v => v.vendor_type === 'lender' || v.vendor_type === 'title_company');

  // Check if we have Non-SSP vendors and Non-SSP coverage is configured  
  const hasNonSSPCoverage = (service.max_split_percentage_non_ssp ?? 0) > 0 && 
    vendors.some(v => v.vendor_type === 'inspector' || v.vendor_type === 'contractor');

  return hasSSPCoverage || hasNonSSPCoverage;
}

/**
 * Legal disclaimer text for marketing coverage
 */
export const COVERAGE_DISCLAIMER = "Coverage requires an approved partner. Availability varies by vendor and agent profile. Amounts are examples only and not a guarantee of coverage. Circle is not stating RESPA compliance and does not assign a monetary value to points.";