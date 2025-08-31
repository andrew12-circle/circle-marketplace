// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceReview {
  id: string;
  rating: number;
  review: string;
  created_at: string;
  verified: boolean;
  review_source?: string;
  source_url?: string;
  // User/Agent info from profiles
  author_name: string;
  author_company?: string;
  author_avatar?: string;
  author_specialties?: string[];
  helpful_count?: number;
}

export const useServiceReviews = (serviceId: string) => {
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!serviceId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch reviews first (without relying on FK join)
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('service_reviews')
          .select(`
            id,
            rating,
            review,
            created_at,
            verified,
            review_source,
            source_url,
            user_id
          `)
          .eq('service_id', serviceId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (reviewsError) {
          throw reviewsError;
        }

        // Load profile data separately and merge client-side
        const userIds = Array.from(new Set((reviewsData || []).map((r: any) => r.user_id).filter(Boolean)));
        let profilesMap: Record<string, any> = {};

        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, display_name, business_name, avatar_url, specialties')
            .in('id', userIds);

          if (!profilesError && profilesData) {
            profilesMap = Object.fromEntries(profilesData.map((p: any) => [p.id, p]));
          }
        }

        // Transform the data to match our interface
        const transformedReviews: ServiceReview[] = (reviewsData || []).map((review: any) => {
          const profile = profilesMap[review.user_id || ''] || {};
          return {
            id: review.id,
            rating: review.rating,
            review: review.review,
            created_at: review.created_at,
            verified: review.verified || false,
            review_source: review.review_source,
            source_url: review.source_url,
            author_name: profile.display_name || profile.business_name || 'Anonymous User',
            author_company: profile.business_name,
            author_avatar: profile.avatar_url,
            author_specialties: profile.specialties || []
          };
        });

        setReviews(transformedReviews);
        setError(null);
      } catch (err) {
        console.error('Error fetching service reviews:', err);
        setError('Failed to load reviews');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [serviceId]);

  return { reviews, loading, error };
};
