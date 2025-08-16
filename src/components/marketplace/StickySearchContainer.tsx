import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Calculate total offset including header and navigation tabs
const getTotalOffset = () => {
  const header = document.querySelector('header') as HTMLElement;
  const navTabs = document.querySelector('[class*="NavigationTabs"], .navigation-tabs, [class*="rounded-xl"][class*="mx-auto"]') as HTMLElement;
  
  const headerHeight = header ? header.offsetHeight : 76;
  const navTabsHeight = navTabs ? navTabs.offsetHeight : 52; // typical tab height
  const spacing = 16; // spacing below nav tabs
  
  return headerHeight + navTabsHeight + spacing;
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
    // Update total offset on mount and resize
    const updateTotalOffset = () => {
      setTotalOffset(getTotalOffset());
    };
    
    updateTotalOffset();
    window.addEventListener('resize', updateTotalOffset);
    
    return () => window.removeEventListener('resize', updateTotalOffset);
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
        className={cn(
          "sticky z-40 bg-background/95 backdrop-blur-sm transition-all duration-200",
          isSticky && "border-b border-border shadow-sm",
          className
        )}
        style={{
          top: isSticky ? `${totalOffset + 7}px` : undefined,
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