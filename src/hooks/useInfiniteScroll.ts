import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  threshold?: number;
  disabled?: boolean;
}

export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  threshold = 200,
  disabled = false
}: UseInfiniteScrollOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || disabled) return;

    setIsLoading(true);
    setError(null);
    
    try {
      await onLoadMore();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
      console.error('Error loading more items:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, disabled, onLoadMore]);

  useEffect(() => {
    if (disabled || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    observerRef.current = observer;

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, threshold, disabled, hasMore]);

  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (sentinelRef.current && observerRef.current) {
      observerRef.current.unobserve(sentinelRef.current);
    }
    
    sentinelRef.current = node;
    
    if (node && observerRef.current) {
      observerRef.current.observe(node);
    }
  }, []);

  return {
    isLoading,
    error,
    setSentinelRef,
    loadMore
  };
};