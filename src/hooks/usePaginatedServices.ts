import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Service } from './useMarketplaceData';

interface PaginatedFilters {
  searchTerm?: string;
  category?: string; // 'all' means no filter
  featured?: boolean;
  verified?: boolean; // Note: applied client-side for now
  coPayEligible?: boolean;
  orderStrategy?: 'ranked' | 'recent';
}

interface PaginatedPage {
  items: Service[];
  totalCount: number;
  nextOffset: number;
}

const PAGE_SIZE = 50;

async function fetchServicesPage(offset: number, filters: PaginatedFilters): Promise<PaginatedPage> {
  let query = supabase
    .from('services')
    .select(`
      *,
      vendors (
        id,
        name,
        rating,
        review_count,
        is_verified,
        website_url,
        logo_url
      )
    `, { count: 'exact' });

  // Apply ordering strategy
  const orderStrategy = filters.orderStrategy || 'ranked';
  if (orderStrategy === 'recent') {
    query = query
      .order('created_at', { ascending: false })
      .order('sort_order', { ascending: true });
  } else {
    query = query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
  }

  // Apply pagination at the end
  query = query.range(offset, offset + PAGE_SIZE - 1);

  // Server-side filters
  const term = (filters.searchTerm || '').trim();
  if (term) {
    // Search title and description
    const like = `%${term}%`;
    query = query.or(`title.ilike.${like},description.ilike.${like}`);
  }

  if (filters.category && filters.category !== 'all' && filters.category !== 'All') {
    query = query.eq('category', filters.category);
  }

  if (filters.featured) {
    query = query.eq('is_featured', true);
  }

  if (filters.coPayEligible) {
    // Use the column name present in services table if available
    query = query.eq('copay_allowed', true);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const formattedServices: Service[] = (data || []).map((service: any) => ({
    ...service,
    discount_percentage: service.discount_percentage ? String(service.discount_percentage) : undefined,
    is_verified: service.is_verified || false,
    vendor: service.vendors ? {
      id: service.vendors.id,
      name: service.vendors.name,
      rating: service.vendors.rating || 4.5,
      review_count: service.vendors.review_count || 0,
      is_verified: service.vendors.is_verified || false,
      website_url: service.vendors.website_url,
      logo_url: service.vendors.logo_url,
    } : null,
  }));

  const totalCount = typeof count === 'number' ? count : formattedServices.length;
  const nextOffset = offset + PAGE_SIZE;

  return { items: formattedServices, totalCount, nextOffset };
}

export function usePaginatedServices(filters: PaginatedFilters) {
  return useInfiniteQuery<PaginatedPage>({
    queryKey: ['services', 'paginated', filters],
    queryFn: ({ pageParam = 0 }) => fetchServicesPage(pageParam as number, filters),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      return lastPage.nextOffset < lastPage.totalCount ? lastPage.nextOffset : undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
