import { useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { useTheme } from "../../contexts/theme-context";

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

// Inner component that handles the actual grid functionality
function InfiniteGridPageInner<T>({
  title,
  fetchItems,
  renderItem,
  pageSize = 50,
  className = "",
}: InfiniteGridPageProps<T>) {
  const { gradientFrom } = useTheme();
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const requestInProgressRef = useRef<boolean>(false);
  const initialLoadDoneRef = useRef<boolean>(false);

  const loadMore = useCallback(async () => {
    // Prevent concurrent requests and duplicate initial loads
    if (requestInProgressRef.current || !hasMore) return;
    if (currentPage === 1 && initialLoadDoneRef.current) return;

    requestInProgressRef.current = true;
    setIsLoading(true);

    try {
      const data = await fetchItems(currentPage, pageSize);
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(currentPage < data.totalPages);
      setCurrentPage((prev) => prev + 1);
      if (currentPage === 1) {
        initialLoadDoneRef.current = true;
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setIsLoading(false);
      requestInProgressRef.current = false;
    }
  }, [currentPage, pageSize, hasMore, fetchItems]);

  // Load first page on mount
  useEffect(() => {
    loadMore();
    // Cleanup on unmount
    return () => {
      initialLoadDoneRef.current = false;
      requestInProgressRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up intersection observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !requestInProgressRef.current &&
          hasMore
        ) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observerRef.current.observe(loaderRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadMore]);

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
          <div
            className={`w-8 h-8 border-2 border-white/20 border-t-${gradientFrom.replace(
              "from-",
              ""
            )} rounded-full animate-spin`}
          />
        )}
      </div>
    </div>
  );
}

// Wrapper component that forces remount when fetchItems changes
export function InfiniteGridPage<T>(props: InfiniteGridPageProps<T>) {
  // Use fetchItems as a key to force remount when it changes
  return <InfiniteGridPageInner key={props.fetchItems.toString()} {...props} />;
}
