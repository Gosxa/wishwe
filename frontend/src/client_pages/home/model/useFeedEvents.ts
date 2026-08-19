'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { listEvents } from '@/shared/client_api/event';
import { usePaginatedList } from '@shared/hooks/usePaginatedList';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';
import { toEventListParams } from './feedQuery';
import { toFeedEvents } from './feedMapper';
import { SEARCH_PARAM } from './useFeedSearch';
import { useFeedToolbar } from './useFeedToolbar';

export const useFeedEvents = () => {
  const { filter, reach, sort } = useFeedToolbar();
  const refreshToken = useEventsRefreshStore(state => state.refreshToken);

  const search = useSearchParams().get(SEARCH_PARAM) ?? '';

  const selection = `${filter}|${reach}|${sort}|${search}`;
  const requestKey = `${selection}|${refreshToken}`;
  const fetchPage = useCallback(
    (page: number) =>
      listEvents({ ...toEventListParams(filter, reach, sort, search), page }),
    [filter, reach, search, sort],
  );
  const pagination = usePaginatedList({
    requestKey,
    loadingKey: selection,
    fetchPage,
    mapItems: toFeedEvents,
    errorMessage: 'Failed to load events',
  });
  const { items: events, ...state } = pagination;

  return { ...state, events };
};
