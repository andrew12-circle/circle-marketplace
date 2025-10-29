/**
 * SSP (Settlement Service Provider) Helper Functions
 * Used to identify and handle different vendor types for RESPA compliance
 */

export interface Vendor {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  location?: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  co_marketing_agents: number;
  campaigns_funded: number;
  service_states?: string[];
  mls_areas?: string[];
  service_radius_miles?: number;
  license_states?: string[];
  latitude?: number;
  longitude?: number;
  vendor_type?: string;
  local_representatives?: any;
  parent_vendor_id?: string;
}

/**
 * Determines if a vendor is an SSP (Settlement Service Provider)
 * SSPs include lenders, title companies, and other RESPA-regulated entities
 */
export const isSSP = (vendor: Vendor): boolean => {
  if (!vendor.vendor_type) return false;
  
  // Direct SSP designation
  if (vendor.vendor_type.toLowerCase() === 'ssp') return true;
  
  // Legacy type checking for backward compatibility
  const sspTypes = [
    'lender',
    'mortgage_lender', 
    'title_company',
    'escrow_company',
    'settlement_agent',
    'mortgage_broker',
    'real_estate_attorney'
  ];
  
  return sspTypes.includes(vendor.vendor_type.toLowerCase());
};

/**
 * Determines if a vendor is Non-SSP (can potentially offer better co-pay rates)
 * Non-SSPs include inspectors, contractors, service providers, etc.
 */
export const isNonSSP = (vendor: Vendor): boolean => {
  if (!vendor.vendor_type) return true; // Default to non-SSP if unknown
  
  // Direct Non-SSP designation
  if (vendor.vendor_type.toLowerCase() === 'non_ssp') return true;
  
  // Legacy type checking for backward compatibility
  const nonSspTypes = [
    'inspector',
    'contractor',
    'service_provider',
    'software_provider',
    'marketing_company',
    'photographer',
    'stager',
    'cleaning_service',
    'handyman',
    'general'
  ];
  
  return nonSspTypes.includes(vendor.vendor_type.toLowerCase());
};

/**
 * Gets the maximum split percentage for a vendor based on SSP status
 */
export const getMaxSplitPercentage = (vendor: Vendor, service: any): number => {
  if (isSSP(vendor)) {
    // SSPs are limited by RESPA split limits
    return service.respa_split_limit || 0;
  } else {
    // Non-SSPs can potentially offer higher splits
    return service.max_split_percentage_non_ssp || service.respa_split_limit || 50;
  }
};

/**
 * Calculates the potential co-pay price for Non-SSP vendors
 */
export const calculateNonSSPCopay = (basePrice: number, service: any): number => {
  const maxSplit = service.max_split_percentage_non_ssp || 70; // Default to 70% for non-SSP
  return basePrice * (1 - (maxSplit / 100));
};

/**
 * Gets pricing display information based on vendor types available
 */
export const getPricingDisplayInfo = (service: any, availableVendors: Vendor[] = []) => {
  const sspVendors = availableVendors.filter(isSSP);
  const nonSspVendors = availableVendors.filter(isNonSSP);
  
  const basePrice = parseFloat(service.pro_price?.replace(/[^\d.]/g, '') || service.retail_price?.replace(/[^\d.]/g, '') || '0');
  
  // If we have non-SSP vendors, show the potential better pricing
  if (nonSspVendors.length > 0 && service.max_split_percentage_non_ssp) {
    const nonSspPrice = calculateNonSSPCopay(basePrice, service);
    return {
      showBothPrices: true,
      sspPrice: basePrice * (1 - ((service.respa_split_limit || 50) / 100)),
      nonSspPrice,
      nonSspLabel: `As low as ~$${nonSspPrice.toFixed(2)} (Non-SSP only)`,
      sspLabel: `$${(basePrice * (1 - ((service.respa_split_limit || 50) / 100))).toFixed(2)} (SSP eligible)`,
      disclaimer: "Actual price depends on vendor partnership approval and compliance requirements."
    };
  }
  
  // Default to standard RESPA pricing
  const standardPrice = basePrice * (1 - ((service.respa_split_limit || 50) / 100));
  return {
    showBothPrices: false,
    standardPrice,
    label: `$${standardPrice.toFixed(2)}`,
    disclaimer: service.respa_split_limit ? "Subject to vendor partnership and RESPA compliance." : undefined
  };
};

/**
 * Filters vendors based on service eligibility and SSP status
 */
export const filterVendorsForService = (vendors: Vendor[], service: any, preferNonSSP: boolean = false) => {
  let filtered = vendors.filter(vendor => {
    // Basic filtering logic - can be expanded based on service requirements
    return vendor.service_states?.length ? true : true; // Include all for now
  });
  
  if (preferNonSSP) {
    // Sort with Non-SSP vendors first
    filtered.sort((a, b) => {
      const aIsNonSSP = isNonSSP(a);
      const bIsNonSSP = isNonSSP(b);
      if (aIsNonSSP && !bIsNonSSP) return -1;
      if (!aIsNonSSP && bIsNonSSP) return 1;
      return 0;
    });
  }
  
  return filtered;
};

/**
 * Gets vendor type display information
 */
export const getVendorTypeInfo = (vendor: Vendor) => {
  if (isSSP(vendor)) {
    return {
      isSSP: true,
      badge: "SSP",
      badgeVariant: "secondary" as const,
      tooltip: "Settlement Service Provider - RESPA compliance limits may apply",
      description: "This vendor is subject to RESPA compliance requirements which may limit co-pay percentages."
    };
  } else {
    return {
      isSSP: false,
      badge: "Non-SSP",
      badgeVariant: "default" as const,
      tooltip: "Non-Settlement Service Provider - May offer flexible co-pay terms",
      description: "This vendor may be able to offer more flexible co-pay assistance terms."
    };
  }
};