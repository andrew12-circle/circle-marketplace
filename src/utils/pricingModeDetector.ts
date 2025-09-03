interface ScrapedContent {
  pricing_tiers?: Array<{
    name: string;
    price?: string;
    features?: string[];
    requestPricing?: boolean;
  }>;
  description?: string;
  title?: string;
  content?: string;
}

interface Service {
  pricing_mode?: string;
  title?: string;
  description?: string;
}

export const detectPricingMode = (scrapedContent: ScrapedContent, service: Service): string => {
  // Respect manual overrides - never overwrite if not 'auto'
  if (service.pricing_mode && service.pricing_mode !== 'auto') {
    return service.pricing_mode;
  }

  const text = [
    scrapedContent.title || '',
    scrapedContent.description || '',
    scrapedContent.content || '',
    service.title || '',
    service.description || ''
  ].join(' ').toLowerCase();

  const pricingTiers = scrapedContent.pricing_tiers || [];

  // Rule 1: If we found at least one currency amount with a plan label, set to 'fixed'
  const hasValidPricing = pricingTiers.some(tier => {
    if (tier.requestPricing) return false;
    
    const price = tier.price || '';
    // Look for currency patterns: $, USD, numbers with decimal
    const hasCurrency = /[$]|usd|\d+\.\d{2}|\d+\/month|\d+\/year/i.test(price);
    const hasName = tier.name && tier.name.trim().length > 0;
    
    return hasCurrency && hasName;
  });

  if (hasValidPricing) {
    console.log('🎯 Pricing mode detected: fixed (found valid pricing with plan names)');
    return 'fixed';
  }

  // Rule 2: If we found a feature grid with plan names but no currency tokens, set to 'features_only'
  const hasFeatureGrid = pricingTiers.some(tier => {
    const hasName = tier.name && tier.name.trim().length > 0;
    const hasFeatures = tier.features && tier.features.length > 0;
    const noValidPrice = !tier.price || !/[$]|usd|\d+\.\d{2}|\d+\/month|\d+\/year/i.test(tier.price);
    
    return hasName && hasFeatures && noValidPrice;
  });

  if (hasFeatureGrid) {
    console.log('🎯 Pricing mode detected: features_only (found feature grid without pricing)');
    return 'features_only';
  }

  // Rule 3: If vendor is flagged as custom or we detect custom pricing keywords
  const customKeywords = [
    'custom pricing',
    'contact for pricing',
    'quote',
    'consultation',
    'contact us',
    'tailored',
    'bespoke',
    'custom quote',
    'get a quote',
    'request pricing',
    'contact for details',
    'pricing varies',
    'starting at',
    'custom solution'
  ];

  const hasCustomKeywords = customKeywords.some(keyword => 
    text.includes(keyword)
  );

  if (hasCustomKeywords) {
    console.log('🎯 Pricing mode detected: custom_quote (found custom pricing keywords)');
    return 'custom_quote';
  }

  // Rule 4: Check for external pricing indicators
  const externalKeywords = [
    'see our website',
    'visit our site',
    'pricing on our website',
    'full pricing at',
    'detailed pricing',
    'complete pricing'
  ];

  const hasExternalKeywords = externalKeywords.some(keyword => 
    text.includes(keyword)
  );

  if (hasExternalKeywords) {
    console.log('🎯 Pricing mode detected: external_link (found external pricing keywords)');
    return 'external_link';
  }

  // Default fallback: if no clear indicators, use custom_quote for safety
  console.log('🎯 Pricing mode detected: custom_quote (fallback - no clear pricing indicators)');
  return 'custom_quote';
};

export const validatePricingMode = (mode: string): string => {
  const validModes = ['auto', 'fixed', 'features_only', 'custom_quote', 'external_link'];
  return validModes.includes(mode) ? mode : 'auto';
};