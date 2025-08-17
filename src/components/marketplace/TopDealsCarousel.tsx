import { useMemo, useEffect } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useABTest } from "@/hooks/useABTest";
import { useSponsoredTracking } from "@/hooks/useSponsoredTracking";
import { SponsoredLabel } from "./SponsoredLabel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star } from "lucide-react";
import { logger } from "@/utils/logger";
import { type Service } from "@/hooks/useMarketplaceData";

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

const calculateScore = (service: Service, rating?: ServiceRatingStats): number => {
  const retailPrice = parsePrice(service.retail_price);
  const proPrice = parsePrice(service.pro_price);
  
  // Discount calculation
  let discountPct = 0;
  if (service.discount_percentage) {
    discountPct = parsePrice(service.discount_percentage);
  } else if (retailPrice > 0 && proPrice > 0) {
    discountPct = ((retailPrice - proPrice) / retailPrice) * 100;
  }
  
  // Trust score
  let trustScore = 0;
  if (service.vendor?.is_verified) trustScore += 20;
  if (rating?.average_rating) trustScore += (rating.average_rating / 5) * 10;
  
  // Featured boost
  const featuredScore = (service.is_featured ? 20 : 0) + (service.is_top_pick ? 15 : 0);
  
  // Co-pay boost
  const coPayScore = service.copay_allowed ? 5 : 0;
  
  // Brand boost (simple heuristic)
  const brandNames = ['hubspot', 'salesforce', 'mailchimp', 'canva', 'zoom'];
  const vendorName = (service.vendor?.name || '').toLowerCase();
  const brandBoost = brandNames.some(brand => vendorName.includes(brand)) ? 10 : 0;

  // Sponsored boost if flagged
  const sponsoredBoost = (service as any).is_sponsored ? ((service as any).sponsored_rank_boost || 50) : 0;
  
  return (0.30 * discountPct) + (0.20 * trustScore) + (0.15 * featuredScore) + (0.10 * coPayScore) + (0.10 * brandBoost) + (0.15 * sponsoredBoost);
};

export const TopDealsCarousel = ({ services, serviceRatings, onServiceClick }: TopDealsCarouselProps) => {
  // Sponsored features enabled by default for Amazon-level experience
  const sponsoredEnabled = true;
  const sponsoredTopDeals = true;
  const sponsoredBadges = true;
  const { trackImpression, trackClick } = useSponsoredTracking();

  const showSponsored = sponsoredEnabled && sponsoredTopDeals;

  const topDeals = useMemo(() => {
    return services
      .map(service => ({
        ...service,
        score: calculateScore(service, serviceRatings?.get(service.id))
      }))
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
    
    // Track sponsored click if applicable
    const service = topDeals.find(s => s.id === serviceId);
    if (showSponsored && service && (service as any).is_sponsored) {
      trackClick({
        serviceId,
        placement: 'top_deals',
        context: 'carousel_click'
      });
    }
    
    onServiceClick(serviceId);
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
            const proPrice = parsePrice(service.pro_price);
            const isSponsored = showSponsored && (service as any).is_sponsored;
            
            let discountPct = 0;
            if (service.discount_percentage) {
              // If discount_percentage is already stored as a number, use it directly
              discountPct = Math.round(parsePrice(service.discount_percentage));
            } else if (retailPrice > 0 && proPrice > 0 && proPrice < retailPrice) {
              // Calculate discount: what % off the retail price
              discountPct = Math.round(((retailPrice - proPrice) / retailPrice) * 100);
              // Debug logging
              console.log(`Discount calc for ${service.title}: retail=$${retailPrice}, pro=$${proPrice}, discount=${discountPct}%`);
            }

            return (
              <CarouselItem key={service.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group relative">
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
                        <Badge variant="destructive" className="text-xs">
                          {discountPct}% OFF
                        </Badge>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        {proPrice > 0 && (
                          <span className="font-bold text-lg text-primary">
                            ${proPrice}
                          </span>
                        )}
                        {retailPrice > proPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${retailPrice}
                          </span>
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
    </div>
  );
};