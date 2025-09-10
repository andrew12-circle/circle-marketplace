import { useMemo, useEffect, useState } from "react";
import { useTopDealsEnabled } from "@/hooks/useAppConfig";
import { useABTest } from "@/hooks/useABTest";
import { useSponsoredTracking } from "@/hooks/useSponsoredTracking";
import { SponsoredLabel } from "./SponsoredLabel";
import { ServiceFunnelModal } from "./ServiceFunnelModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star } from "lucide-react";
import { logger } from "@/utils/logger";
import { type Service } from "@/hooks/useMarketplaceData";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";
import { getUnifiedDisplayPrice, calculateSavings } from "@/utils/sharedPricing";
import { supabase } from "@/integrations/supabase/client";

interface ServiceRatingStats {
  average_rating: number;
  total_reviews: number;
}

interface TopDealsCarouselProps {
  services: Service[];
  serviceRatings?: any;
  onServiceClick: (serviceId: string) => void;
}

import { parsePrice } from "@/utils/parsePrice";

const calculateScore = (service: Service, rating?: ServiceRatingStats, discount?: number | null, config?: any): number => {
  let score = 0;
  
  // Use config weights or defaults
  const weights = config || {
    discountWeight: 0.3,
    ratingWeight: 10,
    featuredBonus: 20,
    copayBonus: 15,
    brandBonus: 0.1,
    sponsoredBonus: 5,
    brandNames: ['hubspot', 'salesforce', 'mailchimp', 'canva', 'zoom']
  };
  
  // Use shared discount calculation for consistency
  const discountValue = discount || 0;
  score += discountValue * weights.discountWeight;
  
  // Trust score weight
  if (rating?.average_rating) {
    score += rating.average_rating * weights.ratingWeight;
  }
  
  // Featured service weight
  if (service.is_featured) {
    score += weights.featuredBonus;
  }
  
  // Co-pay availability weight
  if (service.copay_allowed) {
    score += weights.copayBonus;
  }
  
  // Brand boost
  const vendorName = (service.vendor?.name || '').toLowerCase();
  const brandBoost = weights.brandNames.some((brand: string) => vendorName.includes(brand)) ? 10 : 0;
  score += brandBoost * weights.brandBonus;
  
  // Sponsored content weight
  if ((service as any).is_sponsored) {
    score += weights.sponsoredBonus;
  }
  
  return score;
};

export const TopDealsCarousel = ({ services, serviceRatings, onServiceClick }: TopDealsCarouselProps) => {
  const { profile } = useAuth();
  const { formatPrice } = useCurrency();
  const [topDealsConfig, setTopDealsConfig] = useState<any>(null);

  // Load Top Deals configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('top_deals_config')
          .single();

        if (!error && data?.top_deals_config) {
          setTopDealsConfig(data.top_deals_config);
        }
      } catch (error) {
        console.warn('Failed to load Top Deals config:', error);
      }
    };
    loadConfig();
  }, []);
  
  const topDealsEnabled = useTopDealsEnabled();
  
  // Don't render if disabled via server config
  if (!topDealsEnabled) {
    return null;
  }
  
  // Ensure services is an array
  const safeServices = Array.isArray(services) ? services : [];
  
  // Modal state management - same as ServiceCard
  const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // Sponsored features enabled by default for Amazon-level experience
  const sponsoredEnabled = true;
  const sponsoredTopDeals = true;
  const sponsoredBadges = true;
  const { trackImpression, trackClick } = useSponsoredTracking();

  const showSponsored = sponsoredEnabled && sponsoredTopDeals;

  const topDeals = useMemo(() => {
    return safeServices
      .filter(service => 
        (service as any).is_affiliate || // Affiliate services
        service.respa_split_limit ||     // Copay-enabled services
        (service.is_verified && service.pro_price) // Circle Pro services
      )
      .map(service => {
        try {
          const rating = serviceRatings?.get(service.id);
          const savingsInfo = calculateSavings(service);
          const discount = savingsInfo?.percentage || 0;
          const score = calculateScore(service, rating, discount);
          const dealPrice = getUnifiedDisplayPrice(service);
          
          return {
            ...service,
            score,
            discount,
            dealPrice
          };
        } catch (error) {
          console.warn('Error processing service:', service.id, error);
          return null;
        }
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => (b?.score || 0) - (a?.score || 0))
      .slice(0, 12);
  }, [safeServices, serviceRatings]);

  // Track impressions for sponsored items
  useEffect(() => {
    if (showSponsored && sponsoredBadges) {
      topDeals.forEach(service => {
        if ((service as any).is_sponsored) {
          trackImpression({
            serviceId: service.id,
            placement: 'top_deals',
            context: 'carousel_view'
          });
        }
      });
    }
  }, [topDeals, showSponsored, sponsoredBadges, trackImpression]);

  const handleDealClick = (serviceId: string, serviceName: string) => {
    logger.log('top_deal_clicked', { serviceId, serviceName });
    
    // Find the service and set it as selected
    const service = topDeals.find(s => s.id === serviceId);
    if (!service) return;
    
    // Track sponsored click if applicable
    if (showSponsored && (service as any).is_sponsored) {
      trackClick({
        serviceId,
        placement: 'top_deals',
        context: 'carousel_click'
      });
    }
    
    // Open ServiceFunnelModal instead of calling onServiceClick
    setSelectedService(service);
    setIsFunnelModalOpen(true);
  };

  if (topDeals.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-foreground">🔥 Top Deals</h2>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {topDeals.map((service) => {
            const rating = serviceRatings?.get(service.id);
            const retailPrice = parsePrice(service.retail_price);
            const isSponsored = showSponsored && (service as any).is_sponsored;
            
            // Use precalculated discount and pricing
            const discountPct = service.discount || 0;
            const { price: effectivePrice, label: priceLabel } = service.dealPrice;

            return (
              <CarouselItem key={service.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                <Card 
                  className="h-full hover:shadow-md transition-shadow group relative cursor-pointer"
                  onClick={() => handleDealClick(service.id, service.title)}
                >
                  {/* Sponsored badge */}
                  {isSponsored && sponsoredBadges && (
                    <div className="absolute top-2 right-2 z-10">
                      <SponsoredLabel variant="small" />
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Service image */}
                      {service.image_url && (
                        <div className="w-full h-32 mb-3 overflow-hidden rounded-md bg-white -mx-2">
                          <img 
                            src={service.image_url} 
                            alt={service.title}
                            className="w-full h-full object-contain px-2"
                            loading="lazy"
                          />
                        </div>
                      )}

                       {/* Service title - highlight this is about services */}
                      <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>
                      {service.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {service.description}
                        </p>
                      )}

                      {/* Badges */}
                      <div className="flex gap-1 flex-wrap">
                        {discountPct > 0 && (
                          <Badge variant="destructive" className="text-xs px-2 py-1">
                            {Math.round(discountPct)}% OFF
                          </Badge>
                        )}
                      </div>

                      {/* Price - Match ServiceCard display */}
                      <div className="text-right space-y-1">
                        {service.retail_price && (
                          <div className="text-xs text-muted-foreground line-through">
                            Retail: {formatPrice(retailPrice)}
                          </div>
                        )}
                        
                        {/* Pro Price */}
                        {service.is_verified && service.pro_price && (
                          <div className="text-lg font-bold text-primary">
                            {formatPrice(parsePrice(service.pro_price))}
                          </div>
                        )}
                        
                        {/* Co-Pay Available */}
                        {service.copay_allowed && service.respa_split_limit && (
                          <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                            <div className="text-xs text-green-700 font-medium mb-1">
                              Co-Pay Available
                            </div>
                            <div className="text-sm font-bold text-green-600">
                              Your cost: {formatPrice(effectivePrice)}
                            </div>
                            <div className="text-xs text-green-600">
                              Up to {service.respa_split_limit}% vendor contribution
                            </div>
                          </div>
                        )}
                        
                        {/* Fallback for services without pro price or copay */}
                        {!service.is_verified && !service.copay_allowed && (
                          <div className="text-lg font-bold text-foreground">
                            {formatPrice(retailPrice)}
                          </div>
                        )}
                      </div>

                      {/* Rating */}
                      {rating && rating.average_rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {rating.average_rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({rating.total_reviews})
                          </span>
                        </div>
                      )}

                      {/* CTA */}
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleDealClick(service.id, service.title)}
                      >
                        View Deal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
      
      {/* ServiceFunnelModal - same as ServiceCard */}
      {isFunnelModalOpen && selectedService && (
        <ServiceFunnelModal
          isOpen={isFunnelModalOpen}
          onClose={() => {
            setIsFunnelModalOpen(false);
            setSelectedService(null);
          }}
          service={selectedService}
        />
      )}
    </div>
  );
};