import React from 'react';

/**
 * CSS will-change optimization utilities
 * Helps browsers optimize for animations and prevents forced reflows
 */

export const optimizeForAnimations = (element: HTMLElement) => {
  element.style.willChange = 'transform, opacity';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
};

export const resetOptimizations = (element: HTMLElement) => {
  element.style.willChange = 'auto';
  element.style.backfaceVisibility = '';
  element.style.perspective = '';
};

// Hook to optimize elements for smooth animations
export const useAnimationOptimization = (ref: React.RefObject<HTMLElement>) => {
  React.useEffect(() => {
    if (ref.current) {
      optimizeForAnimations(ref.current);
      
      return () => {
        if (ref.current) {
          resetOptimizations(ref.current);
        }
      };
    }
  }, [ref]);
};