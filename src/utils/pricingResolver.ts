/**
 * Pricing Package Resolution Utility
 * Centralizes logic for resolving the active pricing package for services
 */

export interface PricingPackage {
  id: string;
  label: string;
  retail_price: number | null;
  pro_price: number | null;
  co_pay_price: number | null;
  features?: string[];
  sort_order?: number;
  is_default?: boolean;
}

export interface Service {
  id: string;
  title: string;
  retail_price: number | null;
  pro_price: number | null;
  co_pay_price: number | null;
  pricing_packages?: PricingPackage[];  // or pricing_tiers
  default_package_id?: string | null;
  [key: string]: any; // Allow other service properties
}

/**
 * Resolves the active pricing package for a service
 * Priority order:
 * 1. Requested package ID if provided and exists
 * 2. Service's default_package_id if set and exists
 * 3. Package with lowest sort_order
 * 4. First package in array
 * 5. null if no packages exist
 */
export function resolveActivePackage(
  service: Service,
  requestedId?: string | null
): PricingPackage | null {
  const packages = service.pricing_packages ?? service.pricing_tiers ?? [];
  if (!packages.length) return null;

  // Convert pricing_tiers format to PricingPackage format if needed
  const normalizedPackages: PricingPackage[] = packages.map((pkg: any) => ({
    id: pkg.id || pkg.name || `pkg-${Math.random()}`,
    label: pkg.label || pkg.name || 'Package',
    retail_price: pkg.retail_price != null ? Number(pkg.retail_price) : null,
    pro_price: pkg.pro_price != null ? Number(pkg.pro_price) : null,
    co_pay_price: pkg.co_pay_price != null ? Number(pkg.co_pay_price) : null,
    features: pkg.features || [],
    sort_order: pkg.sort_order ?? 999,
    is_default: pkg.is_default || false
  }));

  // 1. Return requested package if found
  if (requestedId) {
    const requested = normalizedPackages.find(p => p.id === requestedId);
    if (requested) return requested;
  }

  // 2. Return default package if set
  if (service.default_package_id) {
    const defaultPkg = normalizedPackages.find(p => p.id === service.default_package_id);
    if (defaultPkg) return defaultPkg;
  }

  // 3. Return package with lowest sort_order
  const sorted = [...normalizedPackages].sort(
    (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)
  );
  
  return sorted[0];
}

/**
 * Get the display prices from the resolved package with fallback to service-level prices
 */
export function getPackagePrices(service: Service, requestedPackageId?: string | null) {
  const activePackage = resolveActivePackage(service, requestedPackageId);
  
  const retail = Number(
    activePackage?.retail_price ?? service.retail_price ?? 0
  );
  
  const pro = Number(
    activePackage?.pro_price ?? service.pro_price ?? 0
  );
  
  const coPay = activePackage?.co_pay_price ?? service.co_pay_price ?? null;
  
  return {
    activePackage,
    retail,
    pro,
    coPay: coPay != null ? Number(coPay) : null
  };
}

/**
 * Debug utility to trace package resolution
 */
export function debugPackageResolution(service: Service, requestedId?: string | null) {
  const packages = service.pricing_packages ?? service.pricing_tiers ?? [];
  console.log('🔍 Package Resolution Debug:', {
    serviceId: service.id,
    requestedId,
    defaultPackageId: service.default_package_id,
    totalPackages: packages.length,
    packageIds: packages.map((p: any) => p.id || p.name),
    resolved: resolveActivePackage(service, requestedId)?.id
  });
}