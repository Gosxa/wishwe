'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { listUserEvents } from '@/shared/client_api/user';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';
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
  enabled?: boolean;
};

export const useProfileEvents = ({
  userId,
  tab,
  sort,
  refreshKey = 0,
  enabled = true,
}: Args) => {
  const search = useSearchParams().get(SEARCH_PARAM) ?? '';
  const refreshToken = useEventsRefreshStore(state => state.refreshToken);

  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  const active = userId != null && enabled;
  const selection = `${userId}|${active}|${tab}|${sort}|${search}|${refreshKey}|${refreshToken}`;
  const [loadingSelection, setLoadingSelection] = useState(selection);

  if (selection !== loadingSelection) {
    setLoadingSelection(selection);
    setIsLoadingMore(false);
    if (active) setIsLoading(true);
  }

  useEffect(() => {
    if (userId == null || !enabled) return;

    const requestId = ++requestIdRef.current;

    pageRef.current = 1;
    loadingRef.current = true;

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

        loadingRef.current = false;
        setIsLoading(false);
      });

    return () => {
      if (requestId === requestIdRef.current) {
        requestIdRef.current += 1;
      }
    };
  }, [userId, tab, sort, search, refreshKey, refreshToken, enabled]);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore || userId == null || !enabled) return;

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
        if (requestId !== requestIdRef.current) return;

        loadingRef.current = false;
        setIsLoadingMore(false);
      });
  }, [userId, tab, sort, search, hasMore, enabled]);

  return {
    events: active ? events : [],
    isLoading: active ? isLoading : false,
    isLoadingMore: active ? isLoadingMore : false,
    hasMore: active ? hasMore : false,
    loadMore,
    error: active ? error : null,
  };
};
