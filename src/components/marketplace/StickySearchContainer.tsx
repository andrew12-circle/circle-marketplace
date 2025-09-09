import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Calculate header height only (no extra spacing)
const getHeaderHeight = () => {
  const header = document.querySelector('header') as HTMLElement;
  return header ? header.offsetHeight : 76;
};

interface StickySearchContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const StickySearchContainer = ({ children, className }: StickySearchContainerProps) => {
  const [isSticky, setIsSticky] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(76); // default fallback
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update header height on mount and resize
    const updateHeaderHeight = () => {
      const newHeight = getHeaderHeight();
      console.log('🔧 Header height updated:', newHeight);
      setHeaderHeight(newHeight);
    };
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the sentinel is not visible, the search bar should be sticky
        const shouldBeSticky = !entry.isIntersecting;
        console.log('🔧 Sticky state change:', { 
          isIntersecting: entry.isIntersecting, 
          shouldBeSticky, 
          headerHeight,
          boundingClientRect: entry.boundingClientRect 
        });
        setIsSticky(shouldBeSticky);
      },
      {
        rootMargin: `0px 0px 0px 0px`, // No margin adjustment
        threshold: [0, 1]
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [headerHeight]);

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
          top: isSticky ? `${headerHeight + 50}px` : undefined,
        }}
      >
        <div className="container mx-auto px-4 py-2 sm:py-4">
          {children}
        </div>
      </div>
    </>
  );
};