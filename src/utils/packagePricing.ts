/**
 * Package-based pricing utility
 * Prioritizes package-level prices over service-level fallbacks
 */

export interface PricingPackage {
  id: string;
  label?: string;
  name?: string;
  retail_price: number | null;
  pro_price: number | null;
  co_pay_price: number | null;
  features?: string[];
  popular?: boolean;
  is_default?: boolean;
  sort_order?: number;
}

export interface Service {
  id: string;
  title: string;
  retail_price: string | null;
  pro_price: string | null;
  co_pay_price: string | null;
  pricing_packages?: PricingPackage[];
  pricing_tiers?: PricingPackage[];
  default_package_id?: string | null;
  [key: string]: any;
}

/**
 * Get prices for a specific package with proper fallback logic
 * Priority: package-level prices first, then service-level as fallback
 */
export function getPricesForPackage(
  service: Service,
  pkg: PricingPackage,
  isPro: boolean = false
) {
  // Parse package-level prices first
  let retail = pkg.retail_price;
  let pro = pkg.pro_price;
  let coPay = pkg.co_pay_price;

  // Fallback to service-level only if package values are null
  if (retail === null && service.retail_price) {
    retail = parseFloat(service.retail_price.replace(/[^\d.]/g, '')) || null;
  }

  if (pro === null && service.pro_price) {
    pro = parseFloat(service.pro_price.replace(/[^\d.]/g, '')) || null;
  }

  if (coPay === null && service.co_pay_price) {
    const parsed = parseFloat(String(service.co_pay_price).replace(/[^\d.]/g, ''));
    coPay = isNaN(parsed) ? null : parsed;
  }

  // Ensure we have valid numbers
  const retailPrice = retail ?? 0;
  const proPrice = pro ?? retail ?? 0;
  const coPayPrice = coPay;

  // Calculate the "pay now" price based on pro membership
  const payNow = isPro ? proPrice : retailPrice;

  return {
    retail: retailPrice,
    pro: proPrice,
    coPay: coPayPrice,
    payNow
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Get normalized packages array from service
 * Prioritizes pricing_tiers, falls back to pricing_packages
 */
export function getNormalizedPackages(service: Service): PricingPackage[] {
  const packages = service.pricing_tiers?.length ? service.pricing_tiers : service.pricing_packages;
  return packages ?? [];
}

/**
 * Get the active package from service pricing
 * Uses requestedId or default_package_id or first package
 */
export function getActivePackage(
  service: Service,
  requestedId?: string | null
): PricingPackage | null {
  const packages = getNormalizedPackages(service);
  if (!packages.length) return null;

  // Find by requested ID, then default ID, then first package with priority sorting
  return packages.find(pkg => pkg.id === requestedId) 
    ?? packages.find(pkg => pkg.id === service.default_package_id)
    ?? packages.find(pkg => pkg.popular || pkg.is_default)
    ?? packages.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))[0];
}

/**
 * Normalize features to consistent format
 * Handles both string arrays and feature objects
 */
export function normalizeFeatures(features: any): Array<{ text: string; included: boolean; id?: any }> {
  if (!Array.isArray(features)) return [];
  
  return features
    .map((f, i) => {
      if (typeof f === 'string') return { text: f, included: true, id: i };
      if (f && typeof f === 'object' && f.text) {
        return { 
          text: String(f.text), 
          included: f.included !== false, 
          id: f.id ?? i 
        };
      }
      return null;
    })
    .filter((f): f is { text: string; included: boolean; id: any } => 
      f !== null && f.text.trim().length > 0
    );
}