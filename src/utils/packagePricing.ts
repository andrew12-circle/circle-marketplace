/**
 * Package-based pricing utility
 * Prioritizes package-level prices over service-level fallbacks
 */

export interface PricingPackage {
  id: string;
  label: string;
  retail_price: number | null;
  pro_price: number | null;
  co_pay_price: number | null;
  features?: string[];
  popular?: boolean;
}

export interface Service {
  id: string;
  title: string;
  retail_price: string | null;
  pro_price: string | null;
  co_pay_price: string | null;
  pricing_packages?: PricingPackage[];
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
 * Get the active package from service pricing packages
 */
export function getActivePackage(
  service: Service,
  activePackageId: string | null
): PricingPackage | null {
  const packages = service.pricing_packages ?? [];
  if (!packages.length) return null;

  // Find by ID or return first package
  return packages.find(pkg => pkg.id === activePackageId) ?? packages[0];
}