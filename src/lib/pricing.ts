// Pricing configuration and constants
export const PRICING_CONFIG = {
  MONTHLY: {
    priceId: 'price_pro_monthly',
    amount: 97,
    interval: 'month' as const,
    label: 'Monthly',
    description: 'Billed monthly'
  },
  ANNUAL: {
    priceId: 'price_pro_yearly_7off',
    amount: 1083,
    interval: 'year' as const,
    label: 'Annual',
    description: 'Billed annually',
    savings: 7,
    monthlyEquivalent: 90.25
  }
} as const;

export type PricingInterval = 'month' | 'year';

export function formatPrice(amount: number, interval: PricingInterval): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(amount);
}

export function getAnnualSavings(): { percentage: number; monthlyEquivalent: string } {
  const monthlyTotal = PRICING_CONFIG.MONTHLY.amount * 12;
  const annualPrice = PRICING_CONFIG.ANNUAL.amount;
  const savings = ((monthlyTotal - annualPrice) / monthlyTotal) * 100;
  
  return {
    percentage: Math.round(savings),
    monthlyEquivalent: formatPrice(PRICING_CONFIG.ANNUAL.monthlyEquivalent, 'month')
  };
}