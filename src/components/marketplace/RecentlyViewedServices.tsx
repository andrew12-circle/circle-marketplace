import { useState, useEffect } from "react";
import { Clock, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "./ServiceCard";
import { useMarketplaceData } from "@/hooks/useMarketplaceData";
import type { Service } from "@/hooks/useMarketplaceData";

interface ViewedService {
  serviceId: string;
  viewedAt: string;
  title: string;
}

export const RecentlyViewedServices = () => {
  const [viewedServices, setViewedServices] = useState<ViewedService[]>([]);
  const { data: marketplaceData } = useMarketplaceData();

  useEffect(() => {
    const stored = localStorage.getItem('circle-recently-viewed');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Filter out entries older than 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const filtered = parsed.filter((item: ViewedService) => 
          new Date(item.viewedAt).getTime() > thirtyDaysAgo
        );
        setViewedServices(filtered.slice(0, 6)); // Limit to 6 items
      } catch (e) {
        console.warn('Failed to parse recently viewed services');
      }
    }
  }, []);

  const clearRecentlyViewed = () => {
    localStorage.removeItem('circle-recently-viewed');
    setViewedServices([]);
  };

  const removeService = (serviceId: string) => {
    const updated = viewedServices.filter(item => item.serviceId !== serviceId);
    setViewedServices(updated);
    localStorage.setItem('circle-recently-viewed', JSON.stringify(updated));
  };

  // Get actual service data for viewed services
  const recentServices: Service[] = viewedServices
    .map(viewed => 
      marketplaceData?.services.find(service => service.id === viewed.serviceId)
    )
    .filter((service): service is Service => service !== undefined);

  if (viewedServices.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Recently Viewed
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearRecentlyViewed}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentServices.map((service) => (
            <div key={service.id} className="relative group">
              <ServiceCard 
                service={service} 
                variant="compact"
                onView={() => {}} // Recently viewed services don't need to track views again
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeService(service.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 bg-background/80 hover:bg-background"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
        
        {recentServices.length < viewedServices.length && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Some services are no longer available
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Hook to track service views
export const useServiceViewTracker = () => {
  const trackView = (service: Service) => {
    const viewed: ViewedService = {
      serviceId: service.id,
      viewedAt: new Date().toISOString(),
      title: service.title
    };

    try {
      const stored = localStorage.getItem('circle-recently-viewed');
      let viewedServices: ViewedService[] = stored ? JSON.parse(stored) : [];
      
      // Remove if already exists to move it to front
      viewedServices = viewedServices.filter(item => item.serviceId !== service.id);
      
      // Add to front
      viewedServices.unshift(viewed);
      
      // Keep only latest 20 items
      viewedServices = viewedServices.slice(0, 20);
      
      localStorage.setItem('circle-recently-viewed', JSON.stringify(viewedServices));
    } catch (e) {
      console.warn('Failed to save recently viewed service');
    }
  };

  return { trackView };
};
