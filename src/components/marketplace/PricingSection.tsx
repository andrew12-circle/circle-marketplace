import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ExternalLink, Star } from 'lucide-react';
import { RequestQuoteModal } from './RequestQuoteModal';
import { useProviderTracking } from '@/hooks/useProviderTracking';

interface PricingFeature {
  id: string;
  text: string;
  included: boolean;
  isHtml?: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  yearlyPrice?: string;
  yearlyOriginalPrice?: string;
  duration: string;
  features: PricingFeature[];
  isPopular: boolean;
  buttonText: string;
  badge?: string;
  position: number;
  requestPricing?: boolean;
  price_unit?: string;
  price_note?: string;
  cta_label?: string;
  cta_type?: string;
  cta_url?: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  pricing_mode?: string;
  pricing_external_url?: string;
  pricing_cta_label?: string;
  pricing_cta_type?: string;
  pricing_note?: string;
  pricing_tiers?: PricingTier[];
  vendor?: {
    id?: string;
    name: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
    website_url?: string;
    logo_url?: string;
  } | null;
}

interface PricingSectionProps {
  service: Service;
  onPurchase?: (tierId: string) => void;
  onConsultation?: () => void;
}

export const PricingSection = ({ service, onPurchase, onConsultation }: PricingSectionProps) => {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const { trackEvent } = useProviderTracking(service.id, true);

  const pricingMode = service.pricing_mode || 'auto';
  const tiers = service.pricing_tiers || [];

  // Track pricing mode impression
  React.useEffect(() => {
    trackEvent({
      event_type: 'pricing_mode_impression',
      event_data: {
        mode: pricingMode,
        service_id: service.id
      }
    } as any);
  }, [pricingMode, service.id, trackEvent]);

  const handleCTAClick = (action: string, tierId?: string, tierTitle?: string) => {
    trackEvent({
      event_type: 'pricing_cta_click',
      event_data: {
        mode: pricingMode,
        service_id: service.id,
        action,
        card_title: tierTitle
      }
    } as any);

    switch (action) {
      case 'quote':
        setSelectedTierId(tierId || '');
        setIsQuoteModalOpen(true);
        break;
      case 'consult':
        onConsultation?.();
        break;
      case 'external':
        if (service.pricing_external_url) {
          window.open(service.pricing_external_url, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'purchase':
        onPurchase?.(tierId || '');
        break;
    }
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numPrice);
  };

  const shouldShowFixed = () => {
    if (pricingMode === 'fixed') return true;
    if (pricingMode === 'auto') {
      // Auto mode: show fixed if we have valid prices
      return tiers.some(tier => !tier.requestPricing && parseFloat(tier.price || '0') > 0);
    }
    return false;
  };

  const shouldShowFeaturesOnly = () => {
    return pricingMode === 'features_only';
  };

  const shouldShowCustomQuote = () => {
    if (pricingMode === 'custom_quote') return true;
    if (pricingMode === 'auto') {
      // Auto mode: fall back to custom quote if no valid prices
      return !tiers.some(tier => !tier.requestPricing && parseFloat(tier.price || '0') > 0);
    }
    return false;
  };

  const shouldShowExternalLink = () => {
    return pricingMode === 'external_link';
  };

  // Filter out empty tiers
  const validTiers = tiers.filter(tier => tier.name && (tier.features?.length > 0 || !tier.requestPricing));

  // External Link Mode
  if (shouldShowExternalLink() && service.pricing_external_url) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Pricing Information</h3>
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <ExternalLink className="w-12 h-12 mx-auto text-primary mb-4" />
                  <h4 className="text-lg font-semibold mb-2">View Pricing</h4>
                  <p className="text-muted-foreground text-sm">
                    Get detailed pricing information directly from {service.vendor?.name || 'the provider'}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => handleCTAClick('external')}
                  className="w-full"
                  aria-label={`Visit ${service.vendor?.name || 'provider'} pricing page`}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {service.pricing_cta_label || 'See Pricing'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Custom Quote Mode
  if (shouldShowCustomQuote()) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Custom Pricing Available</h3>
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <Star className="w-12 h-12 mx-auto text-primary mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Tailored Solution</h4>
                  {service.pricing_note ? (
                    <p className="text-muted-foreground text-sm mb-4">
                      {service.pricing_note}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm mb-4">
                      We'll create a custom package that fits your specific needs and budget.
                    </p>
                  )}
                </div>
                <Button
                  size="lg"
                  onClick={() => handleCTAClick(service.pricing_cta_type || 'quote')}
                  className="w-full"
                  aria-label="Request custom pricing quote"
                >
                  {service.pricing_cta_label || 'Get a Custom Quote'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Fixed Pricing or Features Only Mode
  if ((shouldShowFixed() || shouldShowFeaturesOnly()) && validTiers.length > 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">
            {shouldShowFeaturesOnly() ? 'Service Options' : 'Pricing Plans'}
          </h3>
          {shouldShowFeaturesOnly() && (
            <p className="text-muted-foreground mb-6">
              Choose the service level that best fits your needs
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {validTiers.slice(0, 4).map((tier) => (
            <Card
              key={tier.id}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                tier.isPopular ? 'border-2 border-primary shadow-lg scale-105' : 'border border-border'
              }`}
            >
              {tier.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                {tier.description && (
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                )}
                
                {/* Show pricing only in fixed mode */}
                {shouldShowFixed() && !tier.requestPricing && (
                  <div className="mt-4">
                    <div className="text-3xl font-bold">
                      {formatPrice(tier.price)}
                      {tier.price_unit && (
                        <span className="text-sm font-normal text-muted-foreground">
                          /{tier.price_unit}
                        </span>
                      )}
                    </div>
                    {tier.originalPrice && parseFloat(tier.originalPrice) > parseFloat(tier.price) && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatPrice(tier.originalPrice)}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground capitalize">
                      {tier.duration}
                    </div>
                    {tier.price_note && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {tier.price_note}
                      </div>
                    )}
                  </div>
                )}

                {tier.requestPricing && (
                  <div className="mt-4">
                    <div className="text-lg font-semibold text-primary">
                      Custom Pricing
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Contact us for a quote
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {tier.features && tier.features.length > 0 && (
                  <ul className="space-y-2">
                    {tier.features.map((feature) => (
                      <li key={feature.id} className="flex items-start space-x-2">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          feature.included ? 'text-green-500' : 'text-gray-300'
                        }`} />
                        <span className={`text-sm ${
                          feature.included ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {feature.isHtml ? (
                            <span dangerouslySetInnerHTML={{ __html: feature.text }} />
                          ) : (
                            feature.text
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  className="w-full mt-6"
                  variant={tier.isPopular ? 'default' : 'outline'}
                  onClick={() => {
                    if (tier.requestPricing || shouldShowFeaturesOnly()) {
                      handleCTAClick(tier.cta_type || 'quote', tier.id, tier.name);
                    } else {
                      handleCTAClick('purchase', tier.id, tier.name);
                    }
                  }}
                  aria-label={`Select ${tier.name} plan`}
                >
                  {tier.cta_label || 
                   (tier.requestPricing || shouldShowFeaturesOnly() ? 'Request Quote' : tier.buttonText || 'Get Started')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Fallback to custom quote if no valid configuration
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-4">Get Pricing Information</h3>
        <div className="max-w-md mx-auto">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-8 text-center">
              <Button
                size="lg"
                onClick={() => handleCTAClick('quote')}
                className="w-full"
                aria-label="Request pricing information"
              >
                Contact for Pricing
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <RequestQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        service={service}
        selectedTierId={selectedTierId}
      />
    </div>
  );
};