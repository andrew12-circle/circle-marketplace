import { useState, useEffect, useMemo } from "react";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "./ServiceCard";
import { useMarketplaceData } from "@/hooks/useMarketplaceData";
import { useServiceViewTracker } from "./RecentlyViewedServices";
import type { Service } from "@/hooks/useMarketplaceData";

interface CustomersAlsoViewedProps {
  currentService: Service;
  maxSuggestions?: number;
}

export const CustomersAlsoViewed = ({ 
  currentService, 
  maxSuggestions = 6 
}: CustomersAlsoViewedProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: marketplaceData } = useMarketplaceData();
  const { trackView } = useServiceViewTracker();

  // Generate smart recommendations based on current service
  const recommendedServices = useMemo(() => {
    if (!marketplaceData?.services) return [];

    const allServices = marketplaceData.services.filter(s => s.id !== currentService.id);
    const recommendations: { service: Service; score: number }[] = [];

    allServices.forEach(service => {
      let score = 0;

      // Same category (high weight)
      if (service.category === currentService.category) {
        score += 50;
      }

      // Similar price range (medium weight)
      const currentPrice = parseFloat(currentService.pro_price || currentService.retail_price || '0');
      const servicePrice = parseFloat(service.pro_price || service.retail_price || '0');
      const priceDiff = Math.abs(currentPrice - servicePrice);
      const maxPrice = Math.max(currentPrice, servicePrice);
      
      if (maxPrice > 0) {
        const priceSimularity = 1 - (priceDiff / maxPrice);
        score += priceSimularity * 20;
      }

      // Similar vendor rating (low weight)
      const currentRating = currentService.vendor?.rating || 0;
      const serviceRating = service.vendor?.rating || 0;
      const ratingDiff = Math.abs(currentRating - serviceRating);
      score += (5 - ratingDiff) * 5;

      // Boost for featured/verified services
      if (service.is_featured) score += 15;
      if (service.vendor?.is_verified) score += 10;
      if (service.is_top_pick) score += 25;

      // Co-pay compatibility
      if (currentService.copay_allowed && service.copay_allowed) {
        score += 15;
      }

      // ROI similarity
      const currentROI = currentService.estimated_roi || 0;
      const serviceROI = service.estimated_roi || 0;
      if (currentROI > 0 && serviceROI > 0) {
        const roiDiff = Math.abs(currentROI - serviceROI);
        const maxROI = Math.max(currentROI, serviceROI);
        const roiSimilarity = 1 - (roiDiff / maxROI);
        score += roiSimilarity * 10;
      }

      // Random factor for variety (small weight)
      score += Math.random() * 5;

      recommendations.push({ service, score });
    });

    // Sort by score and return top suggestions
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions * 2) // Get more than needed for variety
      .map(item => item.service);
  }, [currentService, marketplaceData, maxSuggestions]);

  const visibleServices = recommendedServices.slice(currentIndex, currentIndex + 3);

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex + 3 < recommendedServices.length;

  const scrollLeft = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const scrollRight = () => {
    setCurrentIndex(Math.min(recommendedServices.length - 3, currentIndex + 1));
  };

  if (recommendedServices.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-muted-foreground" />
          Customers also viewed
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={scrollRight}
            disabled={!canScrollRight}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visibleServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              variant="compact"
              onView={() => trackView(service)}
            />
          ))}
        </div>
        
        {recommendedServices.length > 3 && (
          <div className="flex justify-center mt-4">
            <div className="flex gap-2">
              {Array.from({ length: Math.ceil(recommendedServices.length / 3) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index * 3)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    Math.floor(currentIndex / 3) === index
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};