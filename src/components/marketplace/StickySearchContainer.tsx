import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Calculate header height dynamically
const getHeaderHeight = () => {
  const header = document.querySelector('header');
  return header ? header.offsetHeight : 76; // fallback to 76px
};

interface StickySearchContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const StickySearchContainer = ({ children, className }: StickySearchContainerProps) => {
  const [isSticky, setIsSticky] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(76);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update header height on mount and resize
    const updateHeaderHeight = () => {
      setHeaderHeight(getHeaderHeight());
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
        setIsSticky(!entry.isIntersecting);
      },
      {
        rootMargin: `-${headerHeight}px 0px -1px 0px`, // Account for header height
        threshold: 0
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
        className={cn(
          "sticky z-40 bg-background/95 backdrop-blur-sm transition-all duration-200",
          isSticky && "border-b border-border shadow-sm",
          className
        )}
        style={{
          top: isSticky ? `${headerHeight}px` : undefined,
          transform: isSticky ? "translateY(0)" : undefined,
        }}
      >
        <div className="container mx-auto px-4 py-4">
          {children}
        </div>
      </div>
    </>
  );
};