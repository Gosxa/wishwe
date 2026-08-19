'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { listUserEvents } from '@/shared/client_api/user';
import { usePaginatedList } from '@shared/hooks/usePaginatedList';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';
import { toFeedEvents } from '@client_pages/home/model/feedMapper';
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

  const active = userId != null && enabled;
  const selection = `${userId}|${active}|${tab}|${sort}|${search}|${refreshKey}|${refreshToken}`;
  const fetchPage = useCallback(
    (page: number) => {
      if (userId == null) {
        return Promise.reject(new Error('Missing user'));
      }

      return listUserEvents(userId, {
        ...toProfileEventListParams(tab, sort, search),
        page,
      });
    },
    [search, sort, tab, userId],
  );
  const pagination = usePaginatedList({
    enabled: active,
    requestKey: selection,
    fetchPage,
    mapItems: toFeedEvents,
    errorMessage: 'Failed to load events',
  });
  const { items: events, ...state } = pagination;

  return { ...state, events };
};
