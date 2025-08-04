// OPTIMIZED MARKETPLACE COMPONENT: Uses all performance optimizations
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ServiceCard } from "./ServiceCard";
import { EnhancedVendorCard } from "./EnhancedVendorCard";
import { MarketplaceFilters } from "./MarketplaceFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/hooks/useLocation";
import { useOptimizedMarketplace } from "@/hooks/useOptimizedMarketplace";
import { MarketplaceQueryOptions } from "@/services/marketplaceAPI";
import { PerformanceOptimizer } from "@/utils/performanceOptimizer";

interface FilterState {
  category: string;
  priceRange: number[];
  verified: boolean;
  featured: boolean;
  coPayEligible: boolean;
  locationFilter: boolean;
}

type ViewMode = "services" | "vendors";

export const OptimizedMarketplaceGrid = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("services");
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    priceRange: [0, 2000],
    verified: false,
    featured: false,
    coPayEligible: false,
    locationFilter: false
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { location } = useLocation();

  // Convert filters to API format
  const apiFilters: MarketplaceQueryOptions = useMemo(() => ({
    category: filters.category !== "all" ? filters.category : undefined,
    featured: filters.featured || undefined,
    verified: filters.verified || undefined,
    location: filters.locationFilter && location?.state ? { state: location.state } : undefined,
    limit: 100
  }), [filters, location]);

  // Use optimized marketplace hook
  const {
    services,
    vendors,
    categories,
    loading,
    error,
    search,
    getFilteredServices,
    invalidateCache
  } = useOptimizedMarketplace(apiFilters, {
    enablePrefetch: true,
    enableAnalytics: true
  });

  // Debounced search
  const debouncedSearch = useCallback(
    PerformanceOptimizer.debounce(async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await search(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        toast({
          title: "Search failed",
          description: "Unable to search at this time. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [search, toast]
  );

  // Handle search input
  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Get current data to display
  const displayData = useMemo(() => {
    if (searchTerm && searchResults.length > 0) {
      return searchResults;
    }

    if (viewMode === "services") {
      return getFilteredServices();
    }

    return vendors;
  }, [searchTerm, searchResults, viewMode, getFilteredServices, vendors]);

  // Apply client-side filters for complex logic (co-pay eligibility, price range)
  const filteredData = useMemo(() => {
    if (viewMode === "vendors") return displayData;

    return displayData.filter(service => {
      // Price filtering
      const extractPrice = (priceString: string | null | undefined): number => {
        if (!priceString) return 0;
        return parseFloat(priceString.replace(/[^0-9.]/g, '')) || 0;
      };

      const priceValue = extractPrice(service.retail_price);
      const matchesPrice = priceValue >= filters.priceRange[0] && priceValue <= filters.priceRange[1];

      // Co-pay eligibility filtering (complex business logic)
      let matchesCoPayEligible = true;
      if (filters.coPayEligible) {
        const category = service.category?.toLowerCase() || '';
        const title = service.title?.toLowerCase() || '';
        const tags = service.tags?.map((tag: string) => tag.toLowerCase()) || [];

        const safeKeywords = ['digital ads', 'facebook ads', 'google ads', 'display ads', 'retargeting', 'postcards', 'direct mail', 'flyers', 'door hangers', 'brochures', 'educational', 'seminar', 'workshop', 'market report', 'buyer education', 'joint advertising', 'co-branded', 'print advertising'];
        const restrictedKeywords = ['crm', 'lead capture', 'lead generation', 'funnel', 'drip email', 'follow-up', 'seo', 'landing page', 'chatbot', 'sms', 'automation', 'business card', 'sign', 'social media management', 'posting', 'content calendar', 'listing video', 'drone', 'agent video', 'testimonial', 'open house', 'appreciation', 'pop-by', 'gift', 'closing gift', 'referral', 'past client', 'database', 'strategy', 'coaching', 'consulting', 'accountability'];

        const hasRestricted = restrictedKeywords.some(keyword => 
          title.includes(keyword) || category.includes(keyword) || 
          tags.some((tag: string) => tag.includes(keyword))
        );
        const hasSafe = safeKeywords.some(keyword => 
          title.includes(keyword) || category.includes(keyword) || 
          tags.some((tag: string) => tag.includes(keyword))
        );

        matchesCoPayEligible = hasSafe && !hasRestricted;
      }

      return matchesPrice && matchesCoPayEligible;
    });
  }, [displayData, viewMode, filters]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={invalidateCache}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("Search services, vendors, or categories...")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex bg-secondary rounded-lg p-1">
          <Button
            variant={viewMode === "services" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("services")}
          >
            Services
          </Button>
          <Button
            variant={viewMode === "vendors" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("vendors")}
          >
            Vendors
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilters({
            category: "all",
            priceRange: [0, 2000],
            verified: false,
            featured: false,
            coPayEligible: false,
            locationFilter: false
          })}
        >
          <Filter className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={invalidateCache}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <MarketplaceFilters
        categories={categories}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-secondary h-48 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {filteredData.length} {viewMode} found
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredData.map((item: any) => (
              viewMode === "services" ? (
                <ServiceCard
                  key={item.id}
                  service={{
                    ...item,
                    is_top_pick: item.is_top_pick || false,
                    tags: item.tags || []
                  }}
                  onSave={() => {}} // Implement save functionality
                  isSaved={false}
                />
              ) : (
                <EnhancedVendorCard
                  key={item.id}
                  vendor={{
                    ...item,
                    campaigns_funded: item.campaigns_funded || 0,
                    mls_areas: item.mls_areas || [],
                    service_radius_miles: item.service_radius_miles,
                    license_states: item.license_states || [],
                    latitude: item.latitude,
                    longitude: item.longitude,
                    vendor_type: item.vendor_type || 'company'
                  }}
                  onConnect={() => {}} // Implement connect functionality
                />
              )
            ))}
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No {viewMode} found matching your criteria.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setFilters({
                    category: "all",
                    priceRange: [0, 2000],
                    verified: false,
                    featured: false,
                    coPayEligible: false,
                    locationFilter: false
                  });
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};