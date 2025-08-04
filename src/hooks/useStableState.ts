import { useRef, useState, useCallback } from 'react';

// Hook to prevent duplicate state updates and loading loops
export const useStableState = <T>(initialValue: T) => {
  const [state, setState] = useState<T>(initialValue);
  const isUpdatingRef = useRef(false);
  
  const stableSetState = useCallback((newValue: T | ((prev: T) => T)) => {
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    setState(newValue);
    
    // Reset flag after state update
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, []);
  
  return [state, stableSetState] as const;
};

// Hook to debounce loading states
export const useStableLoading = (delay: number = 300) => {
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const setLoadingStable = useCallback((newLoading: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (newLoading) {
      setLoading(true);
    } else {
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
      }, delay);
    }
  }, [delay]);
  
  return [loading, setLoadingStable] as const;
};