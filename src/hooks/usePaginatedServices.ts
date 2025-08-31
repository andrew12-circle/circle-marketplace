// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Service } from './useMarketplaceData';

interface PaginatedFilters {
  searchTerm?: string;
  category?: string; // 'all' means no filter
  featured?: boolean;
  verified?: boolean; // Note: applied client-side for now
  coPayEligible?: boolean;
  orderStrategy?: 'ranked' | 'recent' | 'price-low' | 'price-high';
  page?: number; // Current page number (1-based)
  pageSize?: number; // Items per page
}

interface PaginatedPage {
  items: Service[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const DEFAULT_PAGE_SIZE = 50;

async function fetchServicesPage(filters: PaginatedFilters): Promise<PaginatedPage> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;
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
  } else if (orderStrategy === 'price-low') {
    query = query
      .order('retail_price', { ascending: true })
      .order('sort_order', { ascending: true });
  } else if (orderStrategy === 'price-high') {
    query = query
      .order('retail_price', { ascending: false })
      .order('sort_order', { ascending: true });
  } else {
    query = query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
  }

  // Apply pagination at the end
  query = query.range(offset, offset + pageSize - 1);

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
  const totalPages = Math.ceil(totalCount / pageSize);
  const currentPage = page;
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  return { 
    items: formattedServices, 
    totalCount, 
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage
  };
}

export function usePaginatedServices(filters: PaginatedFilters, options = { enabled: true }) {
  return useQuery<PaginatedPage>({
    queryKey: ['services', 'paginated', filters],
    queryFn: () => 
      Promise.race([
        fetchServicesPage(filters),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Paginated query timeout')), 8000)
        )
      ]) as Promise<PaginatedPage>,
    enabled: options.enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
