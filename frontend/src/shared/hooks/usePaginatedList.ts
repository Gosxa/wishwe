'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Page<Source> = {
  results: Source[];
  next: unknown;
};

type Options<Source, Item> = {
  enabled?: boolean;
  requestKey: string;
  loadingKey?: string;
  fetchPage: (page: number) => Promise<Page<Source>>;
  mapItems: (items: Source[]) => Item[];
  errorMessage: string;
};

export const usePaginatedList = <Source, Item>({
  enabled = true,
  requestKey,
  loadingKey = requestKey,
  fetchPage,
  mapItems,
  errorMessage,
}: Options<Source, Item>) => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState(0);

  const requestIdRef = useRef(0);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  const visibleLoadingKey = `${enabled}|${loadingKey}`;
  const [currentLoadingKey, setCurrentLoadingKey] = useState(visibleLoadingKey);

  if (visibleLoadingKey !== currentLoadingKey) {
    setCurrentLoadingKey(visibleLoadingKey);
    setIsLoadingMore(false);
    setIsLoading(enabled);
  }

  const visibleRequestKey = `${enabled}|${requestKey}`;
  const [currentRequestKey, setCurrentRequestKey] = useState(visibleRequestKey);

  if (visibleRequestKey !== currentRequestKey) {
    setCurrentRequestKey(visibleRequestKey);
    setIsLoadingMore(false);
  }

  useEffect(() => {
    if (!enabled) {
      loadingRef.current = false;

      return;
    }

    const requestId = ++requestIdRef.current;

    pageRef.current = 1;
    loadingRef.current = true;

    fetchPage(1)
      .then(page => {
        if (requestId !== requestIdRef.current) return;

        setItems(mapItems(page.results));
        setHasMore(Boolean(page.next));
        setError(null);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;

        setItems([]);
        setHasMore(false);
        setError(errorMessage);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;

        loadingRef.current = false;
        setIsLoading(false);
      });

    return () => {
      if (requestId === requestIdRef.current) {
        requestIdRef.current += 1;
      }
    };
  }, [attempt, enabled, errorMessage, fetchPage, mapItems, requestKey]);

  const retry = useCallback(() => {
    if (!enabled) return;

    setError(null);
    setIsLoading(true);
    setAttempt(current => current + 1);
  }, [enabled]);

  const loadMore = useCallback(() => {
    if (!enabled || loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    const requestId = requestIdRef.current;
    const nextPage = pageRef.current + 1;

    setIsLoadingMore(true);

    fetchPage(nextPage)
      .then(page => {
        if (requestId !== requestIdRef.current) return;

        pageRef.current = nextPage;
        setItems(current => [...current, ...mapItems(page.results)]);
        setHasMore(Boolean(page.next));
      })
      .catch(() => {})
      .finally(() => {
        if (requestId !== requestIdRef.current) return;

        loadingRef.current = false;
        setIsLoadingMore(false);
      });
  }, [enabled, fetchPage, hasMore, mapItems]);

  return {
    items: enabled ? items : [],
    isLoading: enabled ? isLoading : false,
    isLoadingMore: enabled ? isLoadingMore : false,
    hasMore: enabled ? hasMore : false,
    error: enabled ? error : null,
    loadMore,
    retry,
  };
};
