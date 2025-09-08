import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface KeysetPaginationOptions {
  rpcFunction: string;
  pageSize?: number;
  searchTerm?: string;
  cacheTime?: number;
  staleTime?: number;
}

export const useKeysetPagination = <T extends Record<string, any>>({
  rpcFunction,
  pageSize = 50,
  searchTerm,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  staleTime = 60 * 1000, // 1 minute
}: KeysetPaginationOptions) => {
  const [cursor, setCursor] = useState<string | null>(null);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [rpcFunction, cursor, pageSize, searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(rpcFunction, {
        cursor_date: cursor,
        page_size: pageSize,
        search_term: searchTerm || null,
      });

      if (error) throw error;
      return data as T[];
    },
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus: false,
    enabled: hasNextPage,
  });

  const loadMore = useCallback(() => {
    if (data && data.length > 0) {
      const lastItem = data[data.length - 1];
      const nextCursor = lastItem.created_at;
      
      setAllData(prev => [...prev, ...data.slice(0, -1)]); // Remove last item (it's for has_next check)
      setCursor(nextCursor);
      setHasNextPage(data.length === pageSize + 1);
    }
  }, [data, pageSize]);

  const reset = useCallback(() => {
    setCursor(null);
    setAllData([]);
    setHasNextPage(true);
  }, []);

  return {
    data: allData,
    isLoading,
    error,
    hasNextPage,
    loadMore,
    reset,
    refetch,
  };
};