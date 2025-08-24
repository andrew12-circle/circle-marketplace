import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Service } from './useMarketplaceData';

interface PagedFilters {
  searchTerm?: string;
  category?: string;
  featured?: boolean;
  verified?: boolean;
  coPayEligible?: boolean;
  orderStrategy?: 'ranked' | 'recent';
}

interface PagedResult {
  items: Service[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

const ITEMS_PER_PAGE = 40; // About 10 rows of 4 items each

async function fetchServicesPage(page: number, filters: PagedFilters): Promise<PagedResult> {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  
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

  // Apply pagination
  query = query.range(offset, offset + ITEMS_PER_PAGE - 1);

  // Server-side filters
  const term = (filters.searchTerm || '').trim();
  if (term) {
    if (term.startsWith('cat:')) {
      query = query.contains('tags', [term]);
    } else {
      const keywords = term.split(/\s+/).filter(keyword => keyword.length > 2);
      
      if (keywords.length === 1) {
        const like = `%${keywords[0]}%`;
        query = query.or(`title.ilike.${like},description.ilike.${like},category.ilike.${like}`);
      } else if (keywords.length > 1) {
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
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return { 
    items: formattedServices, 
    totalCount, 
    totalPages,
    currentPage: page
  };
}

export function usePagedServices(page: number, filters: PagedFilters, options = { enabled: true }) {
  const queryClient = useQueryClient();
  
  // Prefetch next page during idle time for better INP
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const prefetchNextPage = () => {
        queryClient.prefetchQuery({
          queryKey: ['services', 'paged', page + 1, filters],
          queryFn: () => fetchServicesPage(page + 1, filters),
          staleTime: 5 * 60 * 1000,
        });
      };
      
      const idleHandle = requestIdleCallback(prefetchNextPage, { timeout: 1000 });
      return () => cancelIdleCallback(idleHandle);
    }
  }, [page, filters, queryClient]);
  
  return useQuery<PagedResult>({
    queryKey: ['services', 'paged', page, filters],
    queryFn: () => 
      Promise.race([
        fetchServicesPage(page, filters),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Paged query timeout')), 8000)
        )
      ]) as Promise<PagedResult>,
    enabled: options.enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}