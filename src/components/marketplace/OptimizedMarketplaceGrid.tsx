import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ServiceCard } from "./ServiceCard";
import { EnhancedVendorCard } from "./EnhancedVendorCard";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/hooks/useLocation";
import { useOptimizedMarketplace } from "@/hooks/useOptimizedMarketplace";
import { useSimpleBackgroundJobs } from "@/hooks/useSimpleBackgroundJobs";
import { MarketplaceOptimizer } from "@/utils/marketplaceOptimizer";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OptimizedMarketplaceGridProps {
  searchTerm?: string;
  selectedCategory?: string;
  viewMode?: "services" | "vendors";
  filters?: {
    featured?: boolean;
    verified?: boolean;
    priceRange?: number[];
  };
}

export const OptimizedMarketplaceGrid = ({
  searchTerm = "",
  selectedCategory = "all",
  viewMode = "services",
  filters = {}
}: OptimizedMarketplaceGridProps) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { location } = useLocation();
  const { queueAnalyticsRefresh } = useSimpleBackgroundJobs();

  // Use optimized marketplace hook
  const {
    services,
    vendors,
    loading,
    error,
    refresh,
    clearCache
  } = useOptimizedMarketplace({
    limit: 50,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    featured: filters.featured,
    location: location?.state
  });

  // Client-side filtering for complex filters that can't be done efficiently in DB
  const filteredServices = services.filter(service => {
    // Search filter (client-side for now - could be moved to full-text search)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        service.title?.toLowerCase().includes(searchLower) ||
        service.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Price range filter (client-side due to string price format)
    if (filters.priceRange) {
      const priceStr = service.retail_price || service.pro_price || "0";
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }
    }

    return true;
  });

  const filteredVendors = vendors.filter(vendor => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        vendor.name?.toLowerCase().includes(searchLower) ||
        vendor.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Verified filter
    if (filters.verified && !vendor.is_verified) {
      return false;
    }

    return true;
  });

  // Pagination for performance
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  
  const paginatedServices = MarketplaceOptimizer.createPaginator(filteredServices, pageSize);
  const paginatedVendors = MarketplaceOptimizer.createPaginator(filteredVendors, pageSize);

  const currentServices = paginatedServices.getPage(currentPage);
  const currentVendors = paginatedVendors.getPage(currentPage);

  // Background refresh analytics
  useEffect(() => {
    const interval = setInterval(() => {
      queueAnalyticsRefresh(5); // Low priority background refresh
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(interval);
  }, [queueAnalyticsRefresh]);

  const handleRefresh = async () => {
    clearCache();
    await refresh();
  };

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button variant="outline" onClick={handleRefresh} className="ml-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const currentItems = viewMode === "services" ? currentServices : currentVendors;
  const totalPages = viewMode === "services" 
    ? paginatedServices.getTotalPages() 
    : paginatedVendors.getTotalPages();

  return (
    <div className="space-y-6">
      {/* Header with refresh option */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {viewMode === "services" ? "Services" : "Vendors"}
          </h2>
          <p className="text-muted-foreground">
            Showing {currentItems.length} of {viewMode === "services" ? filteredServices.length : filteredVendors.length} results
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Results Grid */}
      {currentItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {viewMode === "services" ? (
              currentServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={{
                    ...service,
                    vendor: {
                      name: 'Service Provider',
                      rating: 4.5,
                      review_count: 0,
                      is_verified: true
                    }
                  }}
                  isSaved={false}
                  onSave={() => {}}
                />
              ))
            ) : (
              currentVendors.map((vendor) => (
                <EnhancedVendorCard
                  key={vendor.id}
                  vendor={{
                    ...vendor,
                    co_marketing_agents: 0,
                    campaigns_funded: 0
                  }}
                  
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}
    </div>
  );
};