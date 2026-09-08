import { useCallback, useEffect, useRef, useState } from 'react';

type Page<Source> = {
  results: Source[];
  next: unknown;
};

type Options<Source, Item> = {
  requestKey: string;
  fetchPage: (page: number) => Promise<Page<Source>>;
  mapItems: (items: Source[]) => Item[];
  errorMessage: string;
};

type Snapshot<Item> = {
  key: string;
  attempt: number;
  items: Item[];
  hasMore: boolean;
  error: string | null;
};

export function usePaginatedList<Source, Item>({
  requestKey,
  fetchPage,
  mapItems,
  errorMessage,
}: Options<Source, Item>) {
  const [snapshot, setSnapshot] = useState<Snapshot<Item> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  const isCurrent = snapshot?.key === requestKey && snapshot.attempt === attempt;
  const items = snapshot?.key === requestKey ? snapshot.items : [];
  const hasMore = isCurrent ? snapshot.hasMore : false;
  const error = isCurrent ? snapshot.error : null;
  const isLoading = !isCurrent && !isRefreshing;

  useEffect(() => {
    let cancelled = false;

    pageRef.current = 1;
    loadingRef.current = true;

    fetchPage(1)
      .then((page) => {
        if (cancelled) return;

        setSnapshot({
          key: requestKey,
          attempt,
          items: mapItems(page.results),
          hasMore: Boolean(page.next),
          error: null,
        });
      })
      .catch(() => {
        if (cancelled) return;

        setSnapshot({
          key: requestKey,
          attempt,
          items: [],
          hasMore: false,
          error: errorMessage,
        });
      })
      .finally(() => {
        if (cancelled) return;

        loadingRef.current = false;
        setIsRefreshing(false);
        setIsLoadingMore(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, errorMessage, fetchPage, mapItems, requestKey]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setAttempt((current) => current + 1);
  }, []);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    const nextPage = pageRef.current + 1;

    setIsLoadingMore(true);

    fetchPage(nextPage)
      .then((page) => {
        pageRef.current = nextPage;

        setSnapshot((current) =>
          current && current.key === requestKey && current.attempt === attempt
            ? {
                ...current,
                items: [...current.items, ...mapItems(page.results)],
                hasMore: Boolean(page.next),
              }
            : current,
        );
      })
      .catch(() => {})
      .finally(() => {
        loadingRef.current = false;
        setIsLoadingMore(false);
      });
  }, [attempt, fetchPage, hasMore, mapItems, requestKey]);

  const replaceItem = useCallback((match: (item: Item) => boolean, next: Item) => {
    setSnapshot((current) =>
      current
        ? { ...current, items: current.items.map((item) => (match(item) ? next : item)) }
        : current,
    );
  }, []);

  return {
    items,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    error,
    loadMore,
    refresh,
    replaceItem,
    retry,
  };
}
