// @ts-nocheck
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
        logo_url,
        support_hours
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
    // Check if it's a category tag filter
    if (term.startsWith('cat:')) {
      query = query.contains('tags', [term]);
    } else {
      // Split search term into individual keywords for better matching
      const keywords = term.split(/\s+/).filter(keyword => keyword.length > 2);
      
      if (keywords.length === 1) {
        // Single keyword - search in title, description, category, and tags
        const like = `%${keywords[0]}%`;
        query = query.or(`title.ilike.${like},description.ilike.${like},category.ilike.${like}`);
      } else if (keywords.length > 1) {
        // Multiple keywords - create OR conditions for each keyword
        const conditions = keywords.map(keyword => {
          const like = `%${keyword}%`;
          return `title.ilike.${like},description.ilike.${like},category.ilike.${like}`;
        }).join(',');
        query = query.or(conditions);
      }
    }
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

  // Only show active services
  query = query.eq('is_active', true);

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
      support_hours: service.vendors.support_hours || 'Business Hours',
    } : null,
  }));

  const totalCount = typeof count === 'number' ? count : formattedServices.length;
  const nextOffset = offset + PAGE_SIZE;

  return { items: formattedServices, totalCount, nextOffset };
}

export function usePaginatedServices(filters: PaginatedFilters, options = { enabled: true }) {
  return useInfiniteQuery<PaginatedPage>({
    queryKey: ['services', 'paginated', filters],
    queryFn: ({ pageParam = 0 }) => 
      Promise.race([
        fetchServicesPage(pageParam as number, filters),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Paginated query timeout')), 8000)
        )
      ]) as Promise<PaginatedPage>,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      return lastPage.nextOffset < lastPage.totalCount ? lastPage.nextOffset : undefined;
    },
    enabled: options.enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
