import React, { memo, useRef, useCallback } from 'react';
import { useVirtualScroll, useIntersectionObserver } from '@/hooks/usePerformance';
import './performant-list.css';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  loadMore?: () => void;
  hasNextPage?: boolean;
  loading?: boolean;
  className?: string;
  overscan?: number;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  loadMore,
  hasNextPage = false,
  loading = false,
  className = '',
  overscan = 3
}: VirtualizedListProps<T>) {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { visibleItems, totalHeight, startIndex } = useVirtualScroll({
    itemHeight,
    containerHeight,
    items,
    overscan
  });

  // Intersection observer for infinite loading
  const { isIntersecting } = useIntersectionObserver(loadMoreRef, {
    threshold: 0.1,
    rootMargin: '100px'
  });

  // Load more when intersection is detected
  React.useEffect(() => {
    if (isIntersecting && hasNextPage && !loading && loadMore) {
      loadMore();
    }
  }, [isIntersecting, hasNextPage, loading, loadMore]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    // Throttle scroll events for better performance
    requestAnimationFrame(() => {
      // Update scroll position
    });
  }, []);

  return (
    <div className={className}>
      <div
        ref={scrollElementRef}
        className="virtualized-list-container"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div 
          className="virtualized-list-content"
          style={{ height: totalHeight }}
        >
          {visibleItems.map((item: any) => (
            // eslint-disable-next-line react/forbid-dom-props
            <div
              key={item.id || item.index}
              className="virtualized-list-item"
              style={{
                top: item.offsetTop || (startIndex + item.index) * itemHeight,
                height: itemHeight
              }}
            >
              {renderItem(item, item.index)}
            </div>
          ))}
        </div>

        {/* Load more trigger */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="h-4">
            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Grid Layout Component with Performance Optimization
interface PerformantGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: number;
  gap?: number;
  loadMore?: () => void;
  hasNextPage?: boolean;
  loading?: boolean;
  className?: string;
}

export function PerformantGrid<T extends { id: string }>({
  items,
  renderItem,
  columns = 2,
  gap = 16,
  loadMore,
  hasNextPage = false,
  loading = false,
  className = ''
}: PerformantGridProps<T>) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { isIntersecting } = useIntersectionObserver(loadMoreRef, {
    threshold: 0.1,
    rootMargin: '200px'
  });

  React.useEffect(() => {
    if (isIntersecting && hasNextPage && !loading && loadMore) {
      loadMore();
    }
  }, [isIntersecting, hasNextPage, loading, loadMore]);

  const getGridClassName = () => {
    switch (columns) {
      case 3: return 'performant-grid-3';
      case 4: return 'performant-grid-4';
      default: return 'performant-grid-2';
    }
  };

  return (
    <div className={className}>
      <div className={getGridClassName()}>
        {items.map((item, index) => (
          <div key={item.id} data-index={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Load more trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="mt-8 flex justify-center">
          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          ) : (
            <div className="h-4" />
          )}
        </div>
      )}
    </div>
  );
}

export default memo(VirtualizedList) as typeof VirtualizedList;