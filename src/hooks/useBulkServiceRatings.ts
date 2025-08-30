// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface ServiceRating {
  service_id: string;
  average_rating: number;
  total_reviews: number;
}

interface ServiceRatingStats {
  averageRating: number;
  totalReviews: number;
}

/**
 * Fetch ratings for multiple services in bulk using RPC
 */
const fetchBulkServiceRatings = async (serviceIds: string[]): Promise<Map<string, ServiceRatingStats>> => {
  if (serviceIds.length === 0) {
    return new Map();
  }

  try {
    const { data, error } = await supabase.rpc('get_service_ratings_bulk', {
      p_service_ids: serviceIds
    });

    if (error) {
      logger.error('Error fetching bulk service ratings:', error);
      return new Map();
    }

    const ratingsMap = new Map<string, ServiceRatingStats>();
    
    (data || []).forEach((rating: ServiceRating) => {
      ratingsMap.set(rating.service_id, {
        averageRating: Number(rating.average_rating || 0),
        totalReviews: Number(rating.total_reviews || 0)
      });
    });

    // Fill in missing ratings with default values
    serviceIds.forEach(id => {
      if (!ratingsMap.has(id)) {
        ratingsMap.set(id, { averageRating: 0, totalReviews: 0 });
      }
    });

    return ratingsMap;
  } catch (error) {
    logger.error('Failed to fetch bulk service ratings:', error);
    return new Map();
  }
};

/**
 * Hook to fetch ratings for multiple services at once
 */
export const useBulkServiceRatings = (serviceIds: string[]) => {
  return useQuery({
    queryKey: ['service-ratings-bulk', serviceIds.sort()],
    queryFn: () => fetchBulkServiceRatings(serviceIds),
    enabled: serviceIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Helper hook to get rating for a specific service from bulk data
 */
export const useServiceRatingFromBulk = (serviceId: string, bulkRatings?: Map<string, ServiceRatingStats>) => {
  if (!bulkRatings) {
    return { averageRating: 0, totalReviews: 0 };
  }
  
  return bulkRatings.get(serviceId) || { averageRating: 0, totalReviews: 0 };
};