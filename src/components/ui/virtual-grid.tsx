import { useState, useCallback, useRef, useEffect } from 'react';
import { processInChunks } from '@/utils/taskScheduler';

interface VirtualGridProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  itemsPerRow?: number;
  className?: string;
}

export const VirtualGrid = ({ 
  items, 
  renderItem, 
  itemHeight = 300, 
  containerHeight = 600,
  itemsPerRow = 4,
  className = ""
}: VirtualGridProps) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 12 });
  const [renderedItems, setRenderedItems] = useState<React.ReactNode[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate visible items based on scroll position
  const updateVisibleRange = useCallback((scrollTop: number) => {
    const rowHeight = itemHeight;
    const visibleRows = Math.ceil(containerHeight / rowHeight);
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = startRow + visibleRows + 1; // Add buffer
    
    const start = Math.max(0, startRow * itemsPerRow);
    const end = Math.min(items.length, endRow * itemsPerRow);
    
    setVisibleRange({ start, end });
  }, [items.length, itemHeight, containerHeight, itemsPerRow]);

  // Throttled scroll handler with null safety
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      // Add null safety check to prevent scrollTop errors
      const scrollTop = e.currentTarget?.scrollTop ?? 0;
      updateVisibleRange(scrollTop);
    }, 16); // ~60fps
  }, [updateVisibleRange]);

  // Render visible items in chunks to prevent blocking
  useEffect(() => {
    const visibleItems = items.slice(visibleRange.start, visibleRange.end);
    
    // Update rendered items immediately for simple cases
    setRenderedItems(
      visibleItems.map((item, index) => {
        const actualIndex = visibleRange.start + index;
        return renderItem(item, actualIndex);
      })
    );
  }, [items, visibleRange, renderItem]);

  const totalHeight = Math.ceil(items.length / itemsPerRow) * itemHeight;
  const offsetY = Math.floor(visibleRange.start / itemsPerRow) * itemHeight;

  return (
    <div 
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div 
          style={{ 
            transform: `translateY(${offsetY}px)`,
            display: 'grid',
            gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
            gap: '1rem'
          }}
        >
          {renderedItems}
        </div>
      </div>
    </div>
  );
};