import { useState, useEffect, useMemo, RefObject } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  items: any[];
  overscan?: number;
}

interface VirtualScrollResult {
  visibleItems: any[];
  totalHeight: number;
  scrollTop: number;
  startIndex: number;
  endIndex: number;
}

export const useVirtualScroll = ({
  itemHeight,
  containerHeight,
  items,
  overscan = 3
}: UseVirtualScrollOptions): VirtualScrollResult => {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length - 1
  );

  const visibleItems = useMemo(() => {
    return items.slice(
      Math.max(0, startIndex - overscan),
      endIndex + 1
    ).map((item, index) => ({
      ...item,
      index: startIndex - overscan + index,
      offsetTop: (startIndex - overscan + index) * itemHeight
    }));
  }, [items, startIndex, endIndex, itemHeight, overscan]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    setScrollTop(target.scrollTop);
  };

  return {
    visibleItems,
    totalHeight,
    scrollTop,
    startIndex,
    endIndex
  };
};

// Intersection Observer Hook for lazy loading
export const useIntersectionObserver = (
  ref: RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      const isCurrentlyIntersecting = entry.isIntersecting;
      setIsIntersecting(isCurrentlyIntersecting);
      
      if (isCurrentlyIntersecting) {
        setHasIntersected(true);
      }
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return { isIntersecting, hasIntersected };
};

// Debounce hook for search and input optimization
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized search hook
export const useMemoizedSearch = <T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  delay = 300
) => {
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  return useMemo(() => {
    if (!debouncedSearchTerm.trim()) return items;

    const searchTermLower = debouncedSearchTerm.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) => {
        const fieldValue = item[field];
        return fieldValue && 
               String(fieldValue).toLowerCase().includes(searchTermLower);
      })
    );
  }, [items, debouncedSearchTerm, searchFields]);
};