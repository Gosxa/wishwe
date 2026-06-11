'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { listEvents } from '@/shared/client_api/event';
import { toEventListParams } from './feedQuery';
import { toFeedEvents } from './feedMapper';
import { SEARCH_PARAM } from './useFeedSearch';
import { useFeedToolbarStore } from './useFeedToolbarStore';
import type { FeedEvent } from './types';

export const useFeedEvents = () => {
  const filter = useFeedToolbarStore(state => state.filter);
  const reach = useFeedToolbarStore(state => state.reach);
  const sort = useFeedToolbarStore(state => state.sort);
  const hasHydrated = useFeedToolbarStore(state => state._hasHydrated);

  const search = useSearchParams().get(SEARCH_PARAM) ?? '';

  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  const selection = `${filter}|${reach}|${sort}|${search}`;
  const [loadingSelection, setLoadingSelection] = useState(selection);

  if (selection !== loadingSelection) {
    setLoadingSelection(selection);
    setIsLoading(true);
  }

  useEffect(() => {
    if (!hasHydrated) return;

    const requestId = ++requestIdRef.current;

    pageRef.current = 1;
    loadingRef.current = false;

    listEvents({ ...toEventListParams(filter, reach, sort, search), page: 1 })
      .then(data => {
        if (requestId !== requestIdRef.current) return;

        setEvents(toFeedEvents(data.results));
        setHasMore(Boolean(data.next));
        setError(null);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;

        setEvents([]);
        setHasMore(false);
        setError('Failed to load events');
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;

        setIsLoading(false);
      });
  }, [filter, reach, sort, search, hasHydrated]);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    const requestId = requestIdRef.current;
    const nextPage = pageRef.current + 1;

    setIsLoadingMore(true);

    listEvents({
      ...toEventListParams(filter, reach, sort, search),
      page: nextPage,
    })
      .then(data => {
        if (requestId !== requestIdRef.current) return;

        pageRef.current = nextPage;
        setEvents(prev => [...prev, ...toFeedEvents(data.results)]);
        setHasMore(Boolean(data.next));
      })
      .catch(() => {})
      .finally(() => {
        loadingRef.current = false;
        setIsLoadingMore(false);
      });
  }, [filter, reach, sort, search, hasMore]);

  return { events, isLoading, isLoadingMore, hasMore, loadMore, error };
};
