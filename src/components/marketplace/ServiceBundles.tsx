import { useState, useMemo } from "react";
import { Package, Star, Zap, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServiceCard } from "./ServiceCard";
import { useMarketplaceData } from "@/hooks/useMarketplaceData";
import { useServiceViewTracker } from "./RecentlyViewedServices";
import { parsePrice } from "@/utils/parsePrice";
import type { Service } from "@/hooks/useMarketplaceData";

interface ServiceBundle {
  id: string;
  title: string;
  description: string;
  services: Service[];
  originalPrice: number;
  bundlePrice: number;
  savings: number;
  savingsPercentage: number;
  category: string;
  tags: string[];
}

interface ServiceBundlesProps {
  currentService?: Service;
  category?: string;
  maxBundles?: number;
  className?: string;
}

export const ServiceBundles = ({ 
  currentService, 
  category,
  maxBundles = 3,
  className = ""
}: ServiceBundlesProps) => {
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);
  const { data: marketplaceData } = useMarketplaceData();
  const { trackView } = useServiceViewTracker();

  // Generate smart bundles based on available services
  const bundles = useMemo(() => {
    if (!marketplaceData?.services) return [];

    const allServices = marketplaceData.services;
    const targetCategory = category || currentService?.category;
    const generatedBundles: ServiceBundle[] = [];

    // Bundle 1: Category Complete Bundle
    if (targetCategory) {
      const categoryServices = allServices
        .filter(s => s.category === targetCategory)
        .filter(s => s.id !== currentService?.id)
        .slice(0, 3);

      if (categoryServices.length >= 2) {
        const originalPrice = categoryServices.reduce((sum, s) => 
          sum + parsePrice(s.pro_price || s.retail_price || '0'), 0
        );
        const bundlePrice = originalPrice * 0.85; // 15% discount
        const savings = originalPrice - bundlePrice;

        generatedBundles.push({
          id: `${targetCategory}-complete`,
          title: `${targetCategory} Complete Package`,
          description: `Everything you need for ${targetCategory.toLowerCase()}`,
          services: categoryServices,
          originalPrice,
          bundlePrice,
          savings,
          savingsPercentage: 15,
          category: targetCategory,
          tags: ['Complete', 'Popular']
        });
      }
    }

    // Bundle 2: Starter Bundle (lower priced services)
    const starterServices = allServices
      .filter(s => s.id !== currentService?.id)
      .filter(s => {
        const price = parsePrice(s.pro_price || s.retail_price || '0');
        return price > 0 && price <= 500;
      })
      .sort((a, b) => (a.vendor?.rating || 0) - (b.vendor?.rating || 0))
      .slice(0, 3);

    if (starterServices.length >= 2) {
      const originalPrice = starterServices.reduce((sum, s) => 
        sum + parsePrice(s.pro_price || s.retail_price || '0'), 0
      );
      const bundlePrice = originalPrice * 0.8; // 20% discount
      const savings = originalPrice - bundlePrice;

      generatedBundles.push({
        id: 'starter-bundle',
        title: 'Starter Success Bundle',
        description: 'Perfect for agents just getting started',
        services: starterServices,
        originalPrice,
        bundlePrice,
        savings,
        savingsPercentage: 20,
        category: 'Mixed',
        tags: ['Starter', 'Best Value']
      });
    }

    // Bundle 3: Premium Bundle (higher priced, verified services)
    const premiumServices = allServices
      .filter(s => s.id !== currentService?.id)
      .filter(s => s.vendor?.is_verified && s.is_featured)
      .filter(s => {
        const price = parsePrice(s.pro_price || s.retail_price || '0');
        return price >= 200;
      })
      .slice(0, 3);

    if (premiumServices.length >= 2) {
      const originalPrice = premiumServices.reduce((sum, s) => 
        sum + parsePrice(s.pro_price || s.retail_price || '0'), 0
      );
      const bundlePrice = originalPrice * 0.9; // 10% discount
      const savings = originalPrice - bundlePrice;

      generatedBundles.push({
        id: 'premium-bundle',
        title: 'Premium Pro Bundle',
        description: 'Top-tier services for serious professionals',
        services: premiumServices,
        originalPrice,
        bundlePrice,
        savings,
        savingsPercentage: 10,
        category: 'Premium',
        tags: ['Premium', 'Verified']
      });
    }

    return generatedBundles.slice(0, maxBundles);
  }, [marketplaceData, currentService, category, maxBundles]);

  if (bundles.length === 0) {
    return null;
  }

  const toggleBundle = (bundleId: string) => {
    setExpandedBundle(expandedBundle === bundleId ? null : bundleId);
  };

  const handleBundleSelect = (bundle: ServiceBundle) => {
    // Track views for all services in bundle
    bundle.services.forEach(service => trackView(service));
    
    // Here you would typically handle bundle purchase
    console.log('Bundle selected:', bundle);
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="w-5 h-5 text-muted-foreground" />
          Service Bundles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bundles.map((bundle) => (
          <Card key={bundle.id} className="border-2 hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{bundle.title}</h3>
                    <div className="flex gap-1">
                      {bundle.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{bundle.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {bundle.services.length} services included
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-muted-foreground line-through">
                    ${bundle.originalPrice.toFixed(0)}
                  </div>
                  <div className="text-xl font-bold text-primary">
                    ${bundle.bundlePrice.toFixed(0)}
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    Save ${bundle.savings.toFixed(0)} ({bundle.savingsPercentage}%)
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleBundle(bundle.id)}
                  className="flex-1"
                >
                  {expandedBundle === bundle.id ? 'Hide' : 'View'} Services
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBundleSelect(bundle)}
                  className="flex-1"
                >
                  Select Bundle
                </Button>
              </div>

              {expandedBundle === bundle.id && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t">
                  {bundle.services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      variant="compact"
                      onView={() => trackView(service)}
                      showBundlePrice={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};