import React, { useState, useCallback, useMemo } from 'react';

interface UsePaginationProps {
  totalItems: number;
  itemsPerPage?: number;
  initialPage?: number;
}

export const usePagination = ({ 
  totalItems, 
  itemsPerPage = 20, 
  initialPage = 1 
}: UsePaginationProps) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return { start, end };
  }, [currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    itemsPerPage
  };
};

interface LazyLoadProps {
  threshold?: number;
  onIntersect?: () => void;
  children: React.ReactNode;
}

export const LazyLoadTrigger = ({ 
  threshold = 0.1, 
  onIntersect, 
  children 
}: LazyLoadProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && !isVisible) {
      setIsVisible(true);
      onIntersect?.();
    }
  }, [isVisible, onIntersect]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin: '50px'
    });

    const element = document.getElementById('lazy-load-trigger');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [handleIntersection, threshold]);

  return (
    <div id="lazy-load-trigger">
      {children}
    </div>
  );
};