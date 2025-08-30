// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  subscriber_count: number | null;
  cover_image_url: string | null;
  creator_id: string;
  is_verified: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UseChannelsOptions {
  limit?: number;
  verified?: boolean;
  orderBy?: 'subscriber_count' | 'created_at' | 'updated_at';
  orderDirection?: 'asc' | 'desc';
}

export const useChannels = (options: UseChannelsOptions = {}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('channels')
          .select('*');

        // Apply filters
        if (options.verified !== undefined) {
          query = query.eq('is_verified', options.verified);
        }

        // Apply ordering
        if (options.orderBy) {
          query = query.order(options.orderBy, { 
            ascending: options.orderDirection === 'asc' 
          });
        } else {
          // Default order by subscriber count descending
          query = query.order('subscriber_count', { ascending: false });
        }

        // Apply limit
        if (options.limit) {
          query = query.limit(options.limit);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        setChannels(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch channels');
        console.error('Error fetching channels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [options.limit, options.verified, options.orderBy, options.orderDirection]);

  return { channels, loading, error };
};