import { useEffect, useRef } from 'react';

// Hook to prevent duplicate useEffect calls
export const useStableEffect = (effect: () => void | (() => void), deps: any[]) => {
  const hasRunRef = useRef(false);
  const depsRef = useRef(deps);
  
  // Check if dependencies have actually changed
  const depsChanged = deps.some((dep, index) => dep !== depsRef.current[index]);
  
  useEffect(() => {
    if (!hasRunRef.current || depsChanged) {
      hasRunRef.current = true;
      depsRef.current = deps;
      return effect();
    }
  }, deps);
};