import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StickySearchContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const StickySearchContainer = ({ children, className }: StickySearchContainerProps) => {
  const [isSticky, setIsSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the sentinel is not visible, the search bar should be sticky
        setIsSticky(!entry.isIntersecting);
      },
      {
        rootMargin: "0px 0px -1px 0px", // Trigger just before leaving viewport
        threshold: 0
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Invisible sentinel element */}
      <div ref={sentinelRef} className="h-0" />
      
      {/* Sticky search container */}
      <div
        ref={containerRef}
        className={cn(
          "sticky top-0 z-40 bg-background/95 backdrop-blur-sm transition-all duration-200",
          isSticky && "border-b border-border shadow-sm",
          className
        )}
        style={{
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