import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Simplified fixed offset calculation
const getHeaderOffset = (isMobile: boolean) => {
  // Fixed values based on the header structure
  return isMobile ? 130 : 100; // Mobile header is taller due to two-row layout
};

interface StickySearchContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const StickySearchContainer = ({ children, className }: StickySearchContainerProps) => {
  const [isSticky, setIsSticky] = useState(false);
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  // Use simplified fixed offset
  const totalOffset = getHeaderOffset(isMobile);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the sentinel is not visible, the search bar should be sticky
        setIsSticky(!entry.isIntersecting);
      },
      {
        rootMargin: `-${totalOffset}px 0px -1px 0px`,
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
          top: `${totalOffset}px`,
        }}
      >
        <div className="container mx-auto px-4 py-4">
          {children}
        </div>
      </div>
    </>
  );
};