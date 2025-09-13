import { useEffect, useRef } from "react";

export function useDebouncedCommit<T>(value: T, commit: (v: T) => void, delay = 600) {
  const t = useRef<number | null>(null);
  
  useEffect(() => {
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => commit(value), delay);
    
    return () => { 
      if (t.current) window.clearTimeout(t.current); 
    };
  }, [value, commit, delay]);
}