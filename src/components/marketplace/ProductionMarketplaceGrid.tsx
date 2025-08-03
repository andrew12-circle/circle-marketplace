import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useOptimizedHooks';
import { debounce, RateLimiter, createCleanupManager } from '@/utils/performance';
import OptimizedServiceCard from './OptimizedServiceCard';
import { EnhancedSearch } from './EnhancedSearch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Users, TrendingUp } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  vendor_id: string;
  avg_rating: number;
  total_reviews: number;
  is_featured: boolean;
  image_url?: string;
}

interface Vendor {
  id: string;
  business_name: string;
  display_name: string;
  avatar_url?: string;
  is_verified: boolean;
}

interface SearchFilters {
  query: string;
  categories: string[];
  tags: string[];
  priceRange: [number, number];
  rating: number;
  features: string[];
}

// Rate limiter for API calls
const apiRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

const ProductionMarketplaceGrid = memo(() => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state with memoized initialization
  const [services, setServices] = useState<Service[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [savedServiceIds, setSavedServiceIds] = useState<string[]>([]);
  
  // Search and filter state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    tags: [],
    priceRange: [0, 1000],
    rating: 0,
    features: []
  });

  // Debounced search query
  const debouncedQuery = useDebounce(searchFilters.query, 300);
  
  // Cleanup manager for proper resource management
  const cleanupManager = useMemo(() => createCleanupManager(), []);

  // Memoized filter configurations
  const availableCategories = useMemo(() => 
    Array.from(new Set(services.map(service => service.category).filter(Boolean))), 
    [services]
  );
  
  const availableTags = useMemo(() => 
    Array.from(new Set(services.flatMap(service => service.tags || []))), 
    [services]
  );

  // Optimized data loading with pagination and caching
  const loadData = useCallback(async (pageNum = 0, resetData = false) => {
    // Rate limiting check
    if (!apiRateLimiter.canMakeRequest()) {
      toast({
        title: "Too Many Requests",
        description: "Please wait before making more requests.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build optimized query
      let query = supabase
        .from('services')
        .select(`
          id, title, description, co_pay_price, category, tags,
          vendor_id, is_featured, image_url
        `, { count: 'exact' });

      // Apply filters at database level for performance
      if (debouncedQuery) {
        query = query.ilike('title', `%${debouncedQuery}%`);
      }
      
      if (searchFilters.categories.length) {
        query = query.in('category', searchFilters.categories);
      }
      
      if (searchFilters.tags.length) {
        query = query.overlaps('tags', searchFilters.tags);
      }

      // Pagination
      const pageSize = 12;
      const from = pageNum * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: servicesData, error: servicesError, count } = await query;
      
      if (servicesError) throw servicesError;

      // Transform data efficiently
      const transformedServices = (servicesData || []).map((service: any) => ({
        ...service,
        price: service.co_pay_price || 0,
        avg_rating: 4.5, // Default rating
        total_reviews: 0  // Default reviews
      }));

      // Load vendors if needed (only for new services)
      const vendorIds = Array.from(new Set(transformedServices.map(s => s.vendor_id)));
      const existingVendorIds = new Set(vendors.map(v => v.id));
      const newVendorIds = vendorIds.filter(id => !existingVendorIds.has(id));
      
      let newVendors: Vendor[] = [];
      if (newVendorIds.length > 0) {
        const { data: vendorsData } = await supabase
          .from('profiles')
          .select('user_id, business_name, display_name, avatar_url')
          .in('user_id', newVendorIds);
        
        newVendors = (vendorsData || []).map((v: any) => ({
          id: v.user_id,
          business_name: v.business_name,
          display_name: v.display_name,
          avatar_url: v.avatar_url,
          is_verified: true // Default to verified
        }));
      }

      // Update state efficiently
      if (resetData) {
        setServices(transformedServices);
        setVendors(prev => [...prev.filter(v => !newVendorIds.includes(v.id)), ...newVendors]);
      } else {
        setServices(prev => [...prev, ...transformedServices]);
        setVendors(prev => [...prev, ...newVendors]);
      }

      setHasMore(transformedServices.length === pageSize);
      setPage(pageNum);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      toast({
        title: "Error Loading Services",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, searchFilters.categories, searchFilters.tags, vendors, toast]);

  // Debounced reload for filter changes
  const debouncedReload = useMemo(
    () => debounce(() => {
      setPage(0);
      loadData(0, true);
    }, 300),
    [loadData]
  );

  // Load more for infinite scroll
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadData(page + 1, false);
    }
  }, [loading, hasMore, page, loadData]);

  // Intersection observer for infinite scroll
  const observerRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (node) observer.observe(node);
    
    cleanupManager.addCleanup(() => {
      if (node) observer.unobserve(node);
    });
  }, [loading, hasMore, loadMore, cleanupManager]);

  // Load saved services
  const loadSavedServices = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('saved_services')
        .select('service_id')
        .eq('user_id', user.id);
      
      setSavedServiceIds(data?.map(item => item.service_id) || []);
    } catch (error) {
      // Silently handle saved services error
    }
  }, [user]);

  // Effect for filter changes
  useEffect(() => {
    debouncedReload();
  }, [debouncedReload]);

  // Initial load
  useEffect(() => {
    loadData(0, true);
    loadSavedServices();
    
    return () => cleanupManager.cleanup();
  }, []);

  // Memoized components for performance
  const ServiceGrid = useMemo(() => {
    if (loading && services.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading services...</span>
        </div>
      );
    }

    if (error) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => loadData(0, true)}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (services.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No services found matching your criteria.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {services.map((service, index) => {
          const vendor = vendors.find(v => v.id === service.vendor_id);
          const isSaved = savedServiceIds.includes(service.id);
          
          return (
            <OptimizedServiceCard
              key={service.id}
              service={service}
              vendor={vendor}
              isSaved={isSaved}
            />
          );
        })}
      </div>
    );
  }, [services, vendors, savedServiceIds, loading, error, loadData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Service Marketplace</h1>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {services.length} Services
          </Badge>
        </div>

        {/* Search and Filters */}
        <EnhancedSearch
          onSearchChange={setSearchFilters}
          availableCategories={availableCategories}
          availableTags={availableTags}
        />
      </div>

      {/* Service Grid */}
      {ServiceGrid}

      {/* Loading indicator */}
      {loading && services.length > 0 && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasMore && !loading && (
        <div ref={observerRef} className="h-10" />
      )}

      {/* End of results */}
      {!hasMore && services.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <TrendingUp className="h-6 w-6 mx-auto mb-2" />
          All services loaded
        </div>
      )}
    </div>
  );
});

ProductionMarketplaceGrid.displayName = 'ProductionMarketplaceGrid';

export default ProductionMarketplaceGrid;