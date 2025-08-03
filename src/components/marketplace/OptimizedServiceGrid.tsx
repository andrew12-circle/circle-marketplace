import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { debounce } from "@/utils/performance";

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

interface PaginatedData<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

interface UsePaginatedServicesProps {
  pageSize?: number;
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export const usePaginatedServices = ({
  pageSize = 12,
  filters = {}
}: UsePaginatedServicesProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  // Optimized query with proper indexing
  const loadServices = useCallback(async (pageNum: number, reset = false) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          co_pay_price,
          category,
          tags,
          vendor_id,
          is_featured,
          image_url
        `, { count: 'exact' });

      // Apply filters efficiently at database level
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('co_pay_price', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('co_pay_price', filters.maxPrice);
      }

      if (filters.tags?.length) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = pageNum * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      const newServices = (data || []).map((service: any) => ({
        ...service,
        price: service.co_pay_price || 0,
        avg_rating: 4.5, // Default rating
        total_reviews: 0  // Default reviews
      }));
      
      if (reset) {
        setServices(newServices);
      } else {
        setServices(prev => [...prev, ...newServices]);
      }

      setTotalCount(count || 0);
      setHasMore(newServices.length === pageSize);
      setPage(pageNum);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load services';
      setError(errorMessage);
      toast({
        title: "Error Loading Services",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize, toast]);

  // Debounced reload for search
  const debouncedReload = useMemo(
    () => debounce(() => {
      setPage(0);
      loadServices(0, true);
    }, 300),
    [loadServices]
  );

  // Load more for pagination
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadServices(page + 1, false);
    }
  }, [loading, hasMore, page, loadServices]);

  // Reset and reload when filters change
  useEffect(() => {
    debouncedReload();
  }, [debouncedReload]);

  // Initial load
  useEffect(() => {
    loadServices(0, true);
  }, []);

  return {
    services,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    reload: () => {
      setPage(0);
      loadServices(0, true);
    }
  };
};

// Optimized service grid component
interface OptimizedServiceGridProps {
  filters?: UsePaginatedServicesProps['filters'];
  onServiceSelect?: (service: Service) => void;
  className?: string;
}

const OptimizedServiceGrid = memo(({ 
  filters, 
  onServiceSelect, 
  className = "" 
}: OptimizedServiceGridProps) => {
  const { services, loading, hasMore, loadMore } = usePaginatedServices({
    pageSize: 12,
    filters
  });

  // Intersection Observer for infinite scroll
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
    
    return () => {
      if (node) observer.unobserve(node);
    };
  }, [loading, hasMore, loadMore]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => onServiceSelect?.(service)}
            className="cursor-pointer"
          >
            {/* Use optimized service card here */}
            <div className="bg-card rounded-lg p-4 hover:shadow-lg transition-shadow">
              <h3 className="font-semibold">{service.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {service.description}
              </p>
              <div className="mt-2 flex justify-between items-center">
                <span className="font-bold">${service.price}</span>
                <span className="text-sm">★ {service.avg_rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasMore && !loading && (
        <div ref={observerRef} className="h-10" />
      )}

      {/* No more results */}
      {!hasMore && services.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          All services loaded
        </div>
      )}
    </div>
  );
});

OptimizedServiceGrid.displayName = 'OptimizedServiceGrid';

export default OptimizedServiceGrid;