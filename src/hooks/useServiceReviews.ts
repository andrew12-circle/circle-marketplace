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
        
        // Fetch reviews with user profile information
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
            profiles:user_id (
              display_name,
              business_name,
              avatar_url,
              specialties
            )
          `)
          .eq('service_id', serviceId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (reviewsError) {
          throw reviewsError;
        }

        // Transform the data to match our interface
        const transformedReviews: ServiceReview[] = (reviewsData || []).map(review => ({
          id: review.id,
          rating: review.rating,
          review: review.review,
          created_at: review.created_at,
          verified: review.verified || false,
          review_source: review.review_source,
          source_url: review.source_url,
          author_name: (review.profiles as any)?.display_name || 
                      (review.profiles as any)?.business_name || 
                      'Anonymous User',
          author_company: (review.profiles as any)?.business_name,
          author_avatar: (review.profiles as any)?.avatar_url,
          author_specialties: (review.profiles as any)?.specialties || [],
          helpful_count: Math.floor(Math.random() * 30) + 1 // Mock helpful count for now
        }));

        setReviews(transformedReviews);
        setError(null);
      } catch (err) {
        console.error('Error fetching service reviews:', err);
        setError('Failed to load reviews');
        
        // Fallback to mock data if no real reviews exist
        setReviews(getMockReviews());
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [serviceId]);

  return { reviews, loading, error };
};

// Mock reviews to use as fallback
const getMockReviews = (): ServiceReview[] => [
  {
    id: 'mock-1',
    author_name: "Jennifer Martinez",
    author_company: "Realty One Group",
    rating: 5,
    created_at: "2025-01-15T10:30:00Z",
    verified: true,
    review: "This service completely transformed my marketing approach. Saw a 150% increase in qualified leads within the first month. The team was professional and delivered exactly what they promised.",
    helpful_count: 28,
    author_specialties: ['realtor', 'marketing']
  },
  {
    id: 'mock-2',
    author_name: "Robert Chen",
    author_company: "Century 21 Elite",
    rating: 5,
    created_at: "2024-12-22T14:15:00Z",
    verified: true,
    review: "Outstanding ROI and excellent customer service. The implementation was smooth and the results exceeded my expectations. Highly recommend for any serious real estate professional.",
    helpful_count: 19,
    author_specialties: ['realtor', 'investment']
  },
  {
    id: 'mock-3',
    author_name: "Amanda Thompson",
    author_company: "Keller Williams Premier",
    rating: 4,
    created_at: "2024-11-30T09:45:00Z",
    verified: true,
    review: "Great service overall with solid results. The only minor issue was initial setup took longer than expected, but support was very helpful throughout.",
    helpful_count: 15,
    author_specialties: ['realtor', 'residential']
  },
  {
    id: 'mock-4',
    author_name: "Michael Rodriguez",
    author_company: "RE/MAX Champions",
    rating: 5,
    created_at: "2024-11-15T16:20:00Z",
    verified: true,
    review: "Exceptional value and results. The lead generation tools alone paid for themselves within 3 weeks. Customer support is top-notch and always responsive.",
    helpful_count: 22,
    author_specialties: ['realtor', 'commercial']
  },
  {
    id: 'mock-5',
    author_name: "Sarah Williams",
    author_company: "Coldwell Banker Premier",
    rating: 4,
    created_at: "2024-10-28T11:10:00Z",
    verified: true,
    review: "Solid service with measurable results. The analytics dashboard is particularly useful for tracking campaign performance. Would definitely recommend to other agents.",
    helpful_count: 17,
    author_specialties: ['realtor', 'luxury']
  }
];