import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { OptimizedServiceCard } from "./OptimizedServiceCard";
import { MarketplaceVendorCard } from "./MarketplaceVendorCard";
import { MarketplaceFilters } from "./MarketplaceFilters";
import { CampaignServicesHeader } from "./CampaignServicesHeader";
import { CircleProBanner } from "./CircleProBanner";
import { ServiceDetailsModal } from "./ServiceDetailsModal";
import { AIConciergeBanner } from "./AIConciergeBanner";
import { AddProductModal } from "./AddProductModal";
import { VendorSelectionModal } from "./VendorSelectionModal";
import { TopDealsCarousel } from "./TopDealsCarousel";
import { CategoryBlocks } from "./CategoryBlocks";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Sparkles, Zap, Facebook, Globe, Mail, Share2, Monitor, TrendingUp, Database, Camera, Video, Printer, ArrowRight, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/hooks/useLocation";
import { determineServiceRisk } from "./RESPAComplianceSystem";
import { Link } from "react-router-dom";
import { CategoryMegaMenu } from "./CategoryMegaMenu";
import { EnhancedSearch, SearchFilters } from "./EnhancedSearch";
import { StickySearchContainer } from "./StickySearchContainer";
import { VendorCallToAction } from "./VendorCallToAction";
import { useMarketplaceData, useSavedServices, useInvalidateMarketplace, type Service, type Vendor } from "@/hooks/useMarketplaceData";
import { useMarketplaceFilters } from "@/hooks/useMarketplaceFilters";
import { useBulkServiceRatings } from "@/hooks/useBulkServiceRatings";
import { logger } from "@/utils/logger";
import { useQueryClient } from "@tanstack/react-query";
import { marketplaceCircuitBreaker } from "@/utils/circuitBreaker";
import { usePaginatedServices } from "@/hooks/usePaginatedServices";
import { useABTest } from "@/hooks/useABTest";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useMarketplaceEnabled } from "@/hooks/useAppConfig";
import { cacheManager } from "@/utils/cacheManager";
import { TourDiscoveryButton } from "./TourDiscoveryButton";
import { SmartSearchAutocomplete } from "./SmartSearchAutocomplete";
import { RecentlyViewedServices } from "./RecentlyViewedServices";
import { ServiceBundles } from "./ServiceBundles";
import { QAOverlay } from "../common/QAOverlay";

interface FilterState {
  category: string;
  priceRange: number[];
  verified: boolean;
  featured: boolean;
  coPayEligible: boolean;
  locationFilter: boolean;
}

// Interface types are now imported from the hook
interface LocalRepresentative {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  license_number?: string;
  nmls_id?: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

type ViewMode = "services" | "products" | "vendors";

export const MarketplaceGrid = () => {
  const { t } = useTranslation();
  const bundlesEnabled = useFeatureFlag("serviceBundles", false);
  const marketplaceEnabled = useMarketplaceEnabled(); // Use server-backed config
  
  const { toast } = useToast();

  const handleClearCachePreserveSession = async () => {
    try {
      await cacheManager.clearAllCachePreserveSession();
      toast({
        title: "Cache Cleared",
        description: "Cache cleared successfully (session preserved)",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    }
  };

  // Check server-backed marketplace flag first
  if (!marketplaceEnabled) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-muted-foreground">
            Marketplace Temporarily Unavailable
          </h2>
          <p className="text-muted-foreground">
            The marketplace is currently disabled by an administrator. Please check back later.
          </p>
          <Button variant="outline" onClick={handleClearCachePreserveSession}>
            Clear Cache & Retry
          </Button>
        </div>
      </div>
    );
  }

  // Optimized data fetching with memoization
  const {
    data: marketplaceData,
    isLoading,
    error
  } = useMarketplaceData();
  const {
    data: savedServiceIds = []
  } = useSavedServices();
  const {
    invalidateAll
  } = useInvalidateMarketplace();
  const queryClient = useQueryClient();
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    if (isLoading && !marketplaceData) {
      const id = window.setTimeout(() => setShowRecovery(true), 8000);
      return () => window.clearTimeout(id);
    }
    setShowRecovery(false);
  }, [isLoading, marketplaceData]);

  const resetFailureState = useCallback(() => {
    try {
      marketplaceCircuitBreaker.reset();
    } catch {}
  }, []);

  const handleReloadDataQuick = useCallback(() => {
    try {
      sessionStorage.setItem('forceFreshData', '1');
    } catch {}
    resetFailureState();
    invalidateAll();
  }, [invalidateAll, resetFailureState]);

  const handleHardRefresh = useCallback(async () => {
    try {
      sessionStorage.setItem('forceFreshData', '1');
    } catch {}
    resetFailureState();
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
    } catch {}
    invalidateAll();
    setShowRecovery(false);
  }, [invalidateAll, queryClient, resetFailureState]);

  // Memoize extracted data to prevent unnecessary re-renders
  const services = useMemo(() => (marketplaceData as {
    services: Service[];
    vendors: Vendor[];
  })?.services || [], [marketplaceData]);
  const vendors = useMemo(() => (marketplaceData as {
    services: Service[];
    vendors: Vendor[];
  })?.vendors || [], [marketplaceData]);

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("services");
  const [selectedProductCategory, setSelectedProductCategory] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: "",
    categories: [],
    tags: [],
    priceRange: [0, 1000],
    rating: 0,
    features: []
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<'featured' | 'rating' | 'price'>('featured');
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    priceRange: [0, 2000],
    verified: false,
    featured: false,
    coPayEligible: false,
    locationFilter: false
  });

  const handleEnhancedSearchChange = useCallback((sf: SearchFilters) => {
    setSearchFilters(sf);
    setSearchTerm(sf.query || "");
    setFilters(prev => ({
      ...prev,
      category: sf.categories.length > 0 ? sf.categories[0] : "all",
      priceRange: sf.priceRange,
      featured: sf.features.includes("Featured Service"),
      coPayEligible: sf.features.includes("Co-Pay Available")
    }));
  }, []);

  const { user, profile } = useAuth();
  const { location } = useLocation();

  // Use optimized filtering hook with memoized inputs
  const memoizedFilters = useMemo(() => filters, [filters.category, filters.priceRange[0], filters.priceRange[1], filters.verified, filters.featured, filters.coPayEligible, filters.locationFilter]);
  const {
    filteredServices,
    filteredVendors,
    categories,
    localVendorCount
  } = useMarketplaceFilters(services, vendors, searchTerm, memoizedFilters, location);

  // Sponsored placement settings - enabled by default for Amazon-level experience
  const sponsoredEnabled = true;
  const sponsoredGrid = true;
  const { variant: abVariant } = useABTest('sponsored-placements', { holdout: 0.1 });
  const showSponsoredInGrid = sponsoredEnabled && sponsoredGrid && abVariant === 'ranked';

  // Enable new landing experience for all users
  const showNewLanding = true;

  // Always use ranked sorting for now
  const orderStrategy = 'ranked';
  const [enablePagination, setEnablePagination] = useState(true); // Enable by default to show services immediately

  // Only enable pagination if marketplace is enabled by admin
  const shouldEnablePagination = enablePagination && marketplaceEnabled;

  // Enable pagination when user starts searching or filtering
  useEffect(() => {
    if (searchTerm || filters.category !== 'all' || filters.featured || filters.verified || filters.coPayEligible) {
      setEnablePagination(true);
    }
  }, [searchTerm, filters.category, filters.featured, filters.verified, filters.coPayEligible]);

  const {
    data: paginatedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingServices
  } = usePaginatedServices({
    searchTerm,
    category: filters.category,
    featured: filters.featured,
    verified: filters.verified,
    coPayEligible: filters.coPayEligible,
    orderStrategy
  }, { enabled: shouldEnablePagination });

  const flattenServices = useMemo(() => {
    const items = paginatedData?.pages?.flatMap(p => p.items) || [];
    const extractNumericPrice = (priceString?: string | null): number => {
      if (!priceString) return 0;
      const cleaned = priceString.replace(/[^0-9.]/g, '');
      return parseFloat(cleaned) || 0;
    };
    return items.filter(s => {
      const price = extractNumericPrice(s.retail_price);
      const withinPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];
      const matchesVerified = !filters.verified || !!s.vendor?.is_verified;
      return withinPrice && matchesVerified;
    });
  }, [paginatedData, filters.priceRange, filters.verified]);

  const totalServicesCount = paginatedData?.pages?.[0]?.totalCount ?? 0;
  const baseForFilters = services.length ? services : flattenServices;

  // Memoize service IDs to prevent unnecessary re-fetching of ratings
  const serviceIds = useMemo(() => flattenServices.map(s => s.id), [flattenServices]);
  const { data: bulkRatings } = useBulkServiceRatings(serviceIds);

  // Define product categories with enhanced styling
  const PRODUCT_CATEGORIES = [{
    id: 'facebook-ads',
    name: 'Facebook Ad Campaigns',
    description: 'Professional Facebook advertising services for real estate',
    icon: Facebook,
    gradient: 'from-blue-500 to-blue-600',
    color: 'text-blue-600'
  }, {
    id: 'google-ads',
    name: 'Google Ad Campaigns',
    description: 'Google Ads and search marketing services',
    icon: Globe,
    gradient: 'from-green-500 to-green-600',
    color: 'text-green-600'
  }, {
    id: 'direct-mail',
    name: 'Direct Mail Campaigns',
    description: 'Postcards, flyers, and targeted mail services',
    icon: Mail,
    gradient: 'from-purple-500 to-purple-600',
    color: 'text-purple-600'
  }, {
    id: 'branding-identity',
    name: 'Branding & Identity',
    description: 'Logos, brand kits, and 360 branding packages',
    icon: BookOpen,
    gradient: 'from-fuchsia-500 to-fuchsia-600',
    color: 'text-fuchsia-600'
  }, {
    id: 'social-media',
    name: 'Social Media Management',
    description: 'Complete social media marketing packages',
    icon: Share2,
    gradient: 'from-pink-500 to-pink-600',
    color: 'text-pink-600'
  }, {
    id: 'website-design',
    name: 'Website Design',
    description: 'Professional real estate websites and landing pages',
    icon: Monitor,
    gradient: 'from-indigo-500 to-indigo-600',
    color: 'text-indigo-600'
  }, {
    id: 'seo-services',
    name: 'SEO Services',
    description: 'Search engine optimization for real estate',
    icon: TrendingUp,
    gradient: 'from-orange-500 to-orange-600',
    color: 'text-orange-600'
  }, {
    id: 'crm-tools',
    name: 'CRM & Lead Management',
    description: 'Customer relationship management systems',
    icon: Database,
    gradient: 'from-teal-500 to-teal-600',
    color: 'text-teal-600'
  }, {
    id: 'photography',
    name: 'Real Estate Photography',
    description: 'Professional listing photography services',
    icon: Camera,
    gradient: 'from-yellow-500 to-yellow-600',
    color: 'text-yellow-600'
  }, {
    id: 'videography',
    name: 'Video Marketing',
    description: 'Real estate video production and marketing',
    icon: Video,
    gradient: 'from-red-500 to-red-600',
    color: 'text-red-600'
  }, {
    id: 'print-marketing',
    name: 'Print Marketing Materials',
    description: 'Business cards, brochures, and signage',
    icon: Printer,
    gradient: 'from-gray-500 to-gray-600',
    color: 'text-gray-600'
  }];

  const [localSavedServiceIds, setLocalSavedServiceIds] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [showQAOverlay, setShowQAOverlay] = useState(false);
  
  // Check for QA mode
  const isQAMode = new URLSearchParams(window.location.search).get('qa') === '1';

  // Combine saved services from hook and local state
  const allSavedServiceIds = [...savedServiceIds, ...localSavedServiceIds];

  // Get categories and tags based on view mode
  const getCategories = () => {
    switch (viewMode) {
      case 'services':
        return categories;
      case 'vendors':
        return Array.from(new Set(vendors.map(v => v.name).filter(Boolean)));
      case 'products':
        return PRODUCT_CATEGORIES.map(p => p.name);
      default:
        return [];
    }
  };

  const getTags = () => {
    switch (viewMode) {
      case 'services':
        return Array.from(new Set(flattenServices.flatMap(s => s.tags || []).filter(Boolean)));
      case 'vendors':
        return Array.from(new Set(vendors.map(v => v.description).filter(Boolean)));
      case 'products':
        return [];
      default:
        return [];
    }
  };

  // Filter product categories based on search term
  const filteredProducts = PRODUCT_CATEGORIES.filter(product => {
    if (!searchTerm) return true;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleCategoryClick = (searchTerm: string, categoryName: string) => {
    setSearchTerm(searchTerm);
    setViewMode("services");
    // Scroll to results after state update
    setTimeout(() => {
      const resultsElement = document.getElementById('marketplace-results');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSaveService = useCallback(async (serviceId: string) => {
    if (!profile?.user_id) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save services.",
        variant: "destructive"
      });
      return;
    }
    try {
      // Check if already saved
      const { data: existingSave } = await supabase.from('saved_services').select('id').eq('user_id', profile.user_id).eq('service_id', serviceId).maybeSingle();
      if (existingSave) {
        // Remove from saved
        const { error } = await supabase.from('saved_services').delete().eq('user_id', profile.user_id).eq('service_id', serviceId);
        if (error) throw error;

        // Update local state
        setLocalSavedServiceIds(prev => prev.filter(id => id !== serviceId));
        toast({
          title: "Removed from saved",
          description: "Service removed from your saved list"
        });
      } else {
        // Add to saved
        const { error } = await supabase.from('saved_services').insert({
          user_id: profile.user_id,
          service_id: serviceId,
          notes: ''
        });
        if (error) throw error;

        // Update local state
        setLocalSavedServiceIds(prev => [...prev, serviceId]);
        toast({
          title: "Saved successfully",
          description: "Service added to your saved list"
        });
      }
    } catch (error) {
      logger.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "Failed to save service. Please try again.",
        variant: "destructive"
      });
    }
  }, [profile?.user_id, toast]);

  const handleViewServiceDetails = useCallback((serviceId: string) => {
    const service = flattenServices.find(s => s.id === serviceId) || services.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setIsServiceModalOpen(true);
    }
  }, [flattenServices, services]);

  const handleCloseServiceModal = () => {
    setIsServiceModalOpen(false);
    setSelectedService(null);
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* QA Mode Indicator and Controls */}
          {isQAMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-blue-800">QA Mode Active</span>
                <span className="text-xs text-blue-600">Enhanced diagnostics enabled</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowQAOverlay(true)}>
                  Show Diagnostics
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open('/qa', '_blank')}>
                  Full QA Runner
                </Button>
              </div>
            </div>
          )}

          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-3xl sm:text-6xl font-bold text-black mb-4 lcp-content font-playfair">Agent Marketplace.</h1>
            <p className="text-gray-600 max-w-2xl text-sm lcp-content">This isn't just another directory you can Google. It's a curated, vetted, agent-verified list — at prices you won't find on your own. We've done the homework: tracking what top agents actually use, what works, and what delivers ROI. Tell us your growth path and we'll guide you there faster. And with vendors just a couple clicks away, you'll often cover nearly half of the already reduced cost. No awkward conversations — just real tools, real savings, and real growth.</p>
            
            {/* QA Diagnostics in Hero when in QA mode */}
            {isQAMode && (
              <div className="mt-4 p-2 bg-gray-50 border rounded text-xs space-y-1">
                <div><strong>Services:</strong> {services.length} loaded, {flattenServices.length} after pagination</div>
                <div><strong>Vendors:</strong> {vendors.length} active</div>
                <div><strong>Location:</strong> {location?.state || 'Unknown'}</div>
                <div><strong>Auth:</strong> {user ? `Authenticated (${user.id.slice(0, 8)}...)` : 'Not authenticated'}</div>
              </div>
            )}
          </div>

          {/* Circle Pro Banner - Show for non-signed-in users and non-pro members */}
          {(!user || !profile?.is_pro_member) && <CircleProBanner />}

          {/* AI Concierge Banner - Show for all users */}
          <AIConciergeBanner />

          {/* Campaign Services Header */}
          <CampaignServicesHeader />

          {marketplaceEnabled && (
            <>
              <TopDealsCarousel
                services={flattenServices}
                serviceRatings={bulkRatings}
                onServiceClick={handleViewServiceDetails}
              />
              <CategoryBlocks 
                onCategoryClick={handleCategoryClick}
                services={flattenServices}
              />

              {/* Recently Viewed Services */}
              <RecentlyViewedServices 
                onServiceClick={handleViewServiceDetails}
                className="mb-8"
              />

              {/* Service Bundles */}
              {bundlesEnabled && (
                <ServiceBundles 
                  maxBundles={3}
                  className="mb-8"
                />
              )}

              {/* Sticky Enhanced Search Component */}
              <StickySearchContainer>
                <EnhancedSearch onSearchChange={handleEnhancedSearchChange} availableCategories={getCategories()} availableTags={getTags()} viewMode={viewMode} />
              </StickySearchContainer>

              {/* View Mode Toggle */}
              <div id="marketplace-results" className="flex gap-2 mb-6">
                <Button variant={viewMode === "services" ? "default" : "outline"} onClick={() => setViewMode("services")} className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-9 sm:h-10 text-sm sm:text-base">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  {t('services')}
                </Button>
                <Button variant={viewMode === "products" ? "default" : "outline"} onClick={() => setViewMode("products")} className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-9 sm:h-10 text-sm sm:text-base">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                  Products
                </Button>
                <Button variant={viewMode === "vendors" ? "default" : "outline"} onClick={() => setViewMode("vendors")} className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-9 sm:h-10 text-sm sm:text-base">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                  {t('vendors')}
                </Button>
              </div>

              {/* Grid - Mobile Responsive */}
              {viewMode === "services" && (
                <>
                  <div className="mobile-grid gap-4 sm:gap-6">
                    {flattenServices.map((service, index) => (
                      <OptimizedServiceCard 
                        key={`service-${service.id}-${index}`} 
                        service={service} 
                        onSave={handleSaveService} 
                        onViewDetails={handleViewServiceDetails} 
                        isSaved={allSavedServiceIds.includes(service.id)} 
                        bulkRatings={bulkRatings} 
                      />
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Showing {flattenServices.length} of {totalServicesCount} results
                    </span>
                    {hasNextPage && (
                      <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                        {isFetchingNextPage ? 'Loading…' : 'Load more'}
                      </Button>
                    )}
                  </div>
                </>
              )}

              {viewMode === "products" && (
                selectedProductCategory ? (
                  <div>
                    <div className="mb-6 flex items-center gap-4">
                      <Button variant="outline" onClick={() => setSelectedProductCategory(null)}>
                        ← Back to Products
                      </Button>
                      <h2 className="text-2xl font-bold">
                        {PRODUCT_CATEGORIES.find(p => p.id === selectedProductCategory)?.name}
                      </h2>
                    </div>
                    <div className="mobile-grid gap-4 sm:gap-6">
                      {getServicesForProduct(selectedProductCategory).map((service, index) => (
                        <OptimizedServiceCard 
                          key={`product-${selectedProductCategory}-${service.id}-${index}`} 
                          service={service} 
                          onSave={handleSaveService} 
                          onViewDetails={handleViewServiceDetails} 
                          isSaved={allSavedServiceIds.includes(service.id)} 
                          bulkRatings={bulkRatings} 
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mobile-grid gap-4 sm:gap-6">
                    {filteredProducts.map(product => {
                      const IconComponent = product.icon;
                      return (
                        <div key={product.id} className="group relative overflow-hidden bg-white rounded-xl border border-gray-200 hover:border-gray-300 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1" onClick={() => setSelectedProductCategory(product.id)}>
                          {/* Background Gradient */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

                          {/* Content */}
                          <div className="relative p-6">
                            {/* Icon and Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${product.gradient} flex items-center justify-center shadow-lg`}>
                                <IconComponent className="w-6 h-6 text-white" />
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transform group-hover:translate-x-1 transition-all duration-300" />
                              </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300">
                              {product.name}
                            </h3>

                            {/* Description */}
                            <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-2">
                              {product.description}
                            </p>

                            {/* Footer */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${product.gradient}`} />
                                <span className="text-sm font-medium text-gray-700">
                                  {getServicesForProduct(product.id).length} providers
                                </span>
                              </div>
                              <Button variant="ghost" size="sm" className={`${product.color} hover:bg-gray-50 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0`}>
                                Explore →
                              </Button>
                            </div>
                          </div>

                          {/* Hover Effect Overlay */}
                          <div className="absolute inset-0 ring-1 ring-gray-200 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {viewMode === "vendors" && (
                (isLoading || error) && vendors.length === 0 ? (
                  <div className="space-y-4">
                    <div className="mobile-grid gap-4 sm:gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" onClick={handleReloadDataQuick}>Reload data</Button>
                      <Button onClick={handleHardRefresh}>Try again</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mobile-grid gap-4 sm:gap-6">
                    {filteredVendors.map(vendor => (
                      <MarketplaceVendorCard 
                        key={vendor.id} 
                        vendor={vendor} 
                        onConnect={() => {}} 
                        onViewProfile={() => {}} 
                      />
                    ))}
                  </div>
                )
              )}

              {/* Enhanced Empty State */}
              {(viewMode === "services" && flattenServices.length === 0 || viewMode === "vendors" && filteredVendors.length === 0 || viewMode === "products" && !selectedProductCategory && filteredProducts.length === 0 || viewMode === "products" && selectedProductCategory && getServicesForProduct(selectedProductCategory).length === 0) && (
                <div className="text-center py-12 space-y-6">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {t('noResultsFound', { type: viewMode })}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t('tryAdjustingFilters')}
                    </p>
                  </div>

                  {/* Loading/Error Status Banner */}
                  {(isLoading && !marketplaceData) || (error && !marketplaceData) ? (
                    <div className="mb-6">
                      <div className="rounded-lg border bg-card text-card-foreground p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <span className="text-sm text-center sm:text-left">
                          Oops! Our apologies, the services are not loading. This is common because of a browser error. Please clear your cache and reload.
                        </span>
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button variant="outline" onClick={() => {
                            // Clear browser storage
                            localStorage.clear();
                            sessionStorage.clear();
                            // Force hard refresh with cache bypass
                            window.location.reload();
                          }}>Clear Cache</Button>
                          <Button variant="outline" onClick={handleReloadDataQuick}>Reload data</Button>
                          <Button onClick={handleHardRefresh}>Try again</Button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Popular Search Suggestions */}
                  {viewMode === "services" && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Try searching for:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {['Facebook Ads', 'SEO', 'Photography', 'Direct Mail', 'CRM'].map(term => (
                          <Button key={term} variant="outline" size="sm" onClick={() => {
                            setSearchTerm(term);
                            setSearchFilters(prev => ({
                              ...prev,
                              query: term
                            }));
                          }} className="h-8 text-xs">
                            {term}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button variant="outline" onClick={() => {
                      setSearchTerm("");
                      setFilters({
                        category: "all",
                        priceRange: [0, 2000],
                        verified: false,
                        featured: false,
                        coPayEligible: false,
                        locationFilter: false
                      });
                    }}>
                      {t('clearAll')} filters
                    </Button>

                    {/* Quick Tour Button */}
                    <TourDiscoveryButton />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Service Details Modal */}
      {selectedService && (
        <ServiceDetailsModal 
          service={selectedService} 
          isOpen={isServiceModalOpen} 
          onClose={handleCloseServiceModal} 
        />
      )}

      {/* Add Product Modal */}
      <AddProductModal 
        open={isAddProductModalOpen} 
        onOpenChange={setIsAddProductModalOpen} 
        onProductAdded={() => {}} 
      />

      {/* QA Overlay */}
      {showQAOverlay && (
        <QAOverlay
          isVisible={showQAOverlay}
          onClose={() => setShowQAOverlay(false)}
          currentSortingStrategy={orderStrategy}
        />
      )}
    </>
  );

  // Helper function to get services for a product category
  function getServicesForProduct(productId: string) {
    const productMapping: { [key: string]: string[] } = {
      'facebook-ads': ['facebook', 'social media ads', 'digital marketing', 'meta ads', 'instagram ads', 'social advertising', 'paid social'],
      'google-ads': ['google', 'ppc', 'search ads', 'google adwords', 'paid search', 'sem', 'display ads', 'youtube ads'],
      'direct-mail': ['direct mail', 'postcards', 'flyers', 'mailers', 'print marketing', 'door hangers', 'marketing materials'],
      'branding-identity': ['branding', 'brand', 'brand identity', 'logo', 'brand kit', '360 branding', '360 marketing'],
      'social-media': ['social media', 'social marketing', 'instagram', 'linkedin', 'social management', 'content creation'],
      'website-design': ['website', 'web design', 'landing page', 'web development', 'site design', 'wordpress', 'real estate website'],
      'seo-services': ['seo', 'search optimization', 'search engine', 'organic search', 'local seo', 'google ranking'],
      'crm-tools': ['crm', 'lead management', 'customer management', 'database', 'contact management', 'follow up', 'automation'],
      'photography': ['photography', 'photos', 'listing photos', 'real estate photography', 'professional photos', 'photo shoot'],
      'videography': ['video', 'videography', 'virtual tour', 'listing video', 'drone video', 'property video', 'video production'],
      'print-marketing': ['print', 'business cards', 'brochures', 'signage', 'yard signs', 'banners', 'flyers', 'marketing materials'],
      // Adding more comprehensive mappings for new categories
      'Business Cards': ['business cards', 'cards', 'professional cards', 'networking cards'],
      'Yard Signs': ['yard signs', 'signs', 'real estate signs', 'property signs', 'lawn signs'],
      'Open House Signs': ['open house', 'open house signs', 'directional signs', 'event signs'],
      'Property Flyers': ['flyers', 'property flyers', 'listing flyers', 'marketing flyers'],
      'Listing Brochures': ['brochures', 'listing brochures', 'property brochures', 'marketing brochures'],
      'Door Hangers': ['door hangers', 'door marketing', 'neighborhood marketing'],
      'Postcards': ['postcards', 'direct mail', 'mailers', 'farming postcards'],
      'Branded Materials': ['branded', 'branding', 'logo design', 'brand materials'],
      'Social Media Graphics': ['graphics', 'social graphics', 'design', 'social media design'],
      'Website Templates': ['templates', 'website templates', 'web templates', 'real estate templates'],
      'Email Marketing Templates': ['email', 'email marketing', 'email templates', 'newsletters'],
      'Virtual Tour Software': ['virtual tours', 'virtual tour', '3d tours', 'matterport'],
      'Professional Photography': ['photography', 'professional photos', 'listing photography'],
      'Drone Photography': ['drone', 'aerial photography', 'drone photos', 'aerial shots'],
      'Zillow Leads': ['zillow', 'zillow leads', 'online leads', 'internet leads'],
      'Realtor.com Advertising': ['realtor.com', 'realtor advertising', 'listing syndication'],
      'Lead Generation Software': ['lead generation', 'leads', 'lead capture', 'lead system'],
      'CRM Systems': ['crm', 'customer management', 'contact management', 'database management'],
      'Contact Management Tools': ['contact management', 'contacts', 'database', 'client management'],
      'Sphere Marketing Tools': ['sphere', 'past clients', 'database marketing', 'relationship marketing'],
      'Referral Programs': ['referrals', 'referral system', 'referral marketing'],
      'Expired Listing Data': ['expired listings', 'expired', 'listing data', 'prospect data']
    };
    const keywords = productMapping[productId] || [];
    return baseForFilters.filter(service => {
      const title = service.title?.toLowerCase() || '';
      const description = service.description?.toLowerCase() || '';
      const category = service.category?.toLowerCase() || '';
      const tags = service.tags?.map(tag => tag?.toLowerCase() || '') || [];
      return keywords.some(keyword => title.includes(keyword) || description.includes(keyword) || category.includes(keyword) || tags.some(tag => tag.includes(keyword)));
    });
  }
};
