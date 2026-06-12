'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { listUserEvents } from '@/shared/client_api/user';
import { toFeedEvents } from '@client_pages/home/model/feedMapper';
import type { FeedEvent } from '@client_pages/home/model/types';
import { toProfileEventListParams } from './profileEventsQuery';
import { SEARCH_PARAM } from './useProfileSearch';
import type { ProfileSort, ProfileTab } from './types';

type Args = {
  userId: number | null;
  tab: ProfileTab;
  sort: ProfileSort;
  refreshKey?: number;
};

const noop = () => {};

export const useProfileEvents = ({
  userId,
  tab,
  sort,
  refreshKey = 0,
}: Args) => {
  const search = useSearchParams().get(SEARCH_PARAM) ?? '';

  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  // Archive isn't implemented yet
  const isArchive = tab === 'archive';

  const selection = `${tab}|${sort}|${search}|${refreshKey}`;
  const [loadingSelection, setLoadingSelection] = useState(selection);

  if (selection !== loadingSelection) {
    setLoadingSelection(selection);
    setIsLoading(true);
  }

  useEffect(() => {
    if (isArchive || userId == null) return;

    const requestId = ++requestIdRef.current;

    pageRef.current = 1;
    loadingRef.current = false;

    listUserEvents(userId, {
      ...toProfileEventListParams(tab, sort, search),
      page: 1,
    })
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
  }, [userId, tab, sort, search, isArchive, refreshKey]);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore || userId == null) return;

    loadingRef.current = true;
    const requestId = requestIdRef.current;
    const nextPage = pageRef.current + 1;

    setIsLoadingMore(true);

    listUserEvents(userId, {
      ...toProfileEventListParams(tab, sort, search),
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
  }, [userId, tab, sort, search, hasMore]);

  if (isArchive) {
    return {
      events: [] as FeedEvent[],
      isLoading: false,
      isLoadingMore: false,
      hasMore: false,
      loadMore: noop,
      error: null,
    };
  }

  return { events, isLoading, isLoadingMore, hasMore, loadMore, error };
};
