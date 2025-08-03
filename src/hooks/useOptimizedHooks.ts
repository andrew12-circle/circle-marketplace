import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { debounce, throttle } from '@/utils/performance';

// Enhanced debouncing hook with cancellation
export const useDebounce = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Optimized search hook with request deduplication
export const useOptimizedSearch = <T>(
  searchFn: (query: string) => Promise<T[]>,
  options: {
    debounceMs?: number;
    minLength?: number;
    cacheResults?: boolean;
  } = {}
) => {
  const {
    debounceMs = 300,
    minLength = 2,
    cacheResults = true
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for search results
  const cache = useMemo(() => new Map<string, T[]>(), []);

  // Abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minLength) {
      setResults([]);
      return;
    }

    // Check cache first
    if (cacheResults && cache.has(searchQuery)) {
      setResults(cache.get(searchQuery)!);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const searchResults = await searchFn(searchQuery);
      
      // Only update if request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setResults(searchResults);
        
        // Cache results
        if (cacheResults) {
          cache.set(searchQuery, searchResults);
        }
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [searchFn, minLength, cache, cacheResults]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(performSearch, debounceMs),
    [performSearch, debounceMs]
  );

  // Trigger search when query changes
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearResults: () => setResults([]),
    clearCache: () => cache.clear()
  };
};

// Optimized infinite scroll hook
export const useInfiniteScroll = <T>(
  loadMore: () => Promise<T[]>,
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  } = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    enabled = true
  } = options;

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (loading || !enabled) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setLoading(true);
          loadMore()
            .then((newItems) => {
              setHasMore(newItems.length > 0);
            })
            .catch((error) => {
              console.error('Failed to load more items:', error);
            })
            .finally(() => {
              setLoading(false);
            });
        }
      },
      { threshold, rootMargin }
    );

    if (node) {
      observerRef.current.observe(node);
    }
  }, [loading, hasMore, loadMore, threshold, rootMargin, enabled]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    lastElementRef,
    loading,
    hasMore,
    setHasMore
  };
};

// Request batching hook for multiple API calls
export const useRequestBatching = <T, R>(
  batchFn: (requests: T[]) => Promise<R[]>,
  options: {
    batchSize?: number;
    debounceMs?: number;
  } = {}
) => {
  const {
    batchSize = 10,
    debounceMs = 100
  } = options;

  const [queue, setQueue] = useState<T[]>([]);
  const [results, setResults] = useState<Map<string, R>>(new Map());
  const [loading, setLoading] = useState(false);

  const processBatch = useCallback(async (requests: T[]) => {
    if (requests.length === 0) return;

    setLoading(true);
    try {
      const batchResults = await batchFn(requests);
      
      // Update results map
      setResults(prev => {
        const newResults = new Map(prev);
        requests.forEach((request, index) => {
          if (batchResults[index]) {
            newResults.set(JSON.stringify(request), batchResults[index]);
          }
        });
        return newResults;
      });
    } catch (error) {
      console.error('Batch processing failed:', error);
    } finally {
      setLoading(false);
    }
  }, [batchFn]);

  const debouncedProcess = useMemo(
    () => debounce((requests: T[]) => {
      // Split into batches
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        processBatch(batch);
      }
    }, debounceMs),
    [processBatch, batchSize, debounceMs]
  );

  // Process queue when it changes
  useEffect(() => {
    if (queue.length > 0) {
      debouncedProcess([...queue]);
      setQueue([]);
    }
  }, [queue, debouncedProcess]);

  const addRequest = useCallback((request: T) => {
    setQueue(prev => [...prev, request]);
  }, []);

  const getResult = useCallback((request: T): R | undefined => {
    return results.get(JSON.stringify(request));
  }, [results]);

  return {
    addRequest,
    getResult,
    loading,
    clearResults: () => setResults(new Map())
  };
};