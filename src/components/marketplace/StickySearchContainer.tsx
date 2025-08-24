import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useOptimizedMeasurement, createOptimizedScrollHandler } from "@/utils/layoutOptimizer";

// Calculate total offset using optimized measurement to prevent forced reflows
const getTotalOffset = () => {
  return new Promise<number>((resolve) => {
    requestAnimationFrame(() => {
      const header = document.querySelector('header') as HTMLElement;
      const navTabs = document.querySelector('[class*="NavigationTabs"], .navigation-tabs, [class*="rounded-xl"][class*="mx-auto"]') as HTMLElement;
      
      // Use cached measurements to avoid forced reflows
      const headerHeight = header?.dataset.cachedHeight ? parseInt(header.dataset.cachedHeight) : 76;
      const navTabsHeight = navTabs?.dataset.cachedHeight ? parseInt(navTabs.dataset.cachedHeight) : 52;
      const spacing = 16;
      
      // Cache measurements for next time
      if (header) header.dataset.cachedHeight = headerHeight.toString();
      if (navTabs) navTabs.dataset.cachedHeight = navTabsHeight.toString();
      
      resolve(headerHeight + navTabsHeight + spacing);
    });
  });
};

interface StickySearchContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const StickySearchContainer = ({ children, className }: StickySearchContainerProps) => {
  const [isSticky, setIsSticky] = useState(false);
  const [totalOffset, setTotalOffset] = useState(144); // default fallback
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTotalOffset = async () => {
      const offset = await getTotalOffset();
      setTotalOffset(offset);
    };
    
    updateTotalOffset();
    
    const handleResize = () => {
      requestAnimationFrame(() => {
        updateTotalOffset();
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the sentinel is not visible, the search bar should be sticky
        setIsSticky(!entry.isIntersecting);
      },
      {
        rootMargin: `-${totalOffset}px 0px -1px 0px`, // Account for total offset
        threshold: 0
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [totalOffset]);

  return (
    <>
      {/* Invisible sentinel element */}
      <div ref={sentinelRef} className="h-0" />
      
      {/* Sticky search container */}
      <div
        ref={containerRef}
        data-tour="search-container"
        className={cn(
          "sticky z-40 bg-background/95 backdrop-blur-sm transition-all duration-200",
          isSticky && "border-b border-border shadow-sm",
          className
        )}
        style={{
          top: isSticky ? `${totalOffset + 21}px` : undefined,
          transform: isSticky ? "translateY(0)" : undefined,
        }}
      >
        <div className="container mx-auto px-4 pb-4">
          {children}
        </div>
      </div>
    </>
  );
};