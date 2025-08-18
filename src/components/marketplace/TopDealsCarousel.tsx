import { useMemo, useEffect, useState } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
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
import { computeDiscountPercentage, getDealDisplayPrice } from "@/utils/dealPricing";

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

const calculateScore = (service: Service, rating?: ServiceRatingStats, discount?: number | null): number => {
  let score = 0;
  
  // Use shared discount calculation for consistency
  const discountValue = discount || 0;
  score += discountValue * 0.3;
  
  // Trust score weight
  if (rating?.average_rating) {
    score += rating.average_rating * 10;
  }
  
  // Featured service weight
  if (service.is_featured) {
    score += 20;
  }
  
  // Co-pay availability weight
  if (service.copay_allowed) {
    score += 15;
  }
  
  // Brand boost (simple heuristic)
  const brandNames = ['hubspot', 'salesforce', 'mailchimp', 'canva', 'zoom'];
  const vendorName = (service.vendor?.name || '').toLowerCase();
  const brandBoost = brandNames.some(brand => vendorName.includes(brand)) ? 10 : 0;
  score += brandBoost * 0.1;
  
  // Sponsored content weight (lower priority)
  if ((service as any).is_sponsored) {
    score += 5;
  }
  
  return score;
};

export const TopDealsCarousel = ({ services, serviceRatings, onServiceClick }: TopDealsCarouselProps) => {
  const { profile } = useAuth();
  const { formatPrice } = useCurrency();
  
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
    return services
      .map(service => {
        const rating = serviceRatings?.get(service.id);
        const discount = computeDiscountPercentage(service);
        const score = calculateScore(service, rating, discount);
        const dealPrice = getDealDisplayPrice(service);
        
        return {
          ...service,
          score,
          discount,
          dealPrice
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [services, serviceRatings]);

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

                      {/* Discount badge */}
                      {discountPct > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 h-5">
                          {discountPct}% OFF
                        </Badge>
                      )}

                      {/* Price */}
                      <div className="text-right">
                        {priceLabel === 'Potential Co-Pay' ? (
                          <>
                            <div className="text-lg font-bold text-primary">
                              {formatPrice(effectivePrice)}
                            </div>
                            <div className="text-sm text-muted-foreground line-through">
                              {formatPrice(retailPrice)}
                            </div>
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 mt-1">
                              Potential Co-Pay
                            </Badge>
                          </>
                        ) : (
                          <>
                            <div className="text-lg font-bold text-primary">
                              {formatPrice(effectivePrice)}
                            </div>
                            {priceLabel !== 'Retail Price' && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {priceLabel}
                              </div>
                            )}
                            {priceLabel === 'Circle Pro Price' && retailPrice !== effectivePrice && (
                              <div className="text-sm text-muted-foreground line-through">
                                {formatPrice(retailPrice)}
                              </div>
                            )}
                          </>
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