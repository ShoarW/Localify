import { useEffect, useState, useRef, useCallback, ReactNode } from "react";

interface InfiniteGridPageProps<T> {
  title: string;
  fetchItems: (
    page: number,
    pageSize: number
  ) => Promise<{
    items: T[];
    totalPages: number;
  }>;
  renderItem: (item: T) => ReactNode;
  pageSize?: number;
  className?: string;
}

export function InfiniteGridPage<T>({
  title,
  fetchItems,
  renderItem,
  pageSize = 50,
  className = "",
}: InfiniteGridPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const data = await fetchItems(currentPage, pageSize);
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(currentPage < data.totalPages);
      setCurrentPage((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, isLoading, hasMore, fetchItems]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`flex-1 p-8 overflow-y-auto ${className}`}>
      <h1 className="text-3xl font-bold text-white mb-8">{title}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {items.map((item, index) => (
          <div key={index}>{renderItem(item)}</div>
        ))}
      </div>

      {/* Loader */}
      <div ref={loaderRef} className="mt-8 flex justify-center">
        {isLoading && (
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}
