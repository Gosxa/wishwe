import { useCallback, useMemo, useState } from 'react';

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { listEvents, type BackendEvent } from '@/lib/api/events';
import { toEventListParams, normalizeSort } from '@/lib/events/feed-query';
import { toFeedEvents } from '@/lib/events/mapper';
import type { FeedEvent, FeedFilter, FeedReach, SortOption } from '@/lib/events/types';

export function useFeedEvents() {
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [reach, setReach] = useState<FeedReach>('all');
  const [sort, setSort] = useState<SortOption>('recent');
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebouncedValue(search.trim());
  const effectiveSort = normalizeSort(filter, sort);

  const requestKey = `${filter}|${reach}|${effectiveSort}|${debouncedSearch}`;

  const fetchPage = useCallback(
    (page: number) =>
      listEvents({
        ...toEventListParams(filter, reach, effectiveSort, debouncedSearch),
        page,
      }),
    [debouncedSearch, effectiveSort, filter, reach],
  );

  const mapItems = useCallback((events: BackendEvent[]) => toFeedEvents(events), []);

  const pagination = usePaginatedList<BackendEvent, FeedEvent>({
    requestKey,
    fetchPage,
    mapItems,
    errorMessage: 'Failed to load events',
  });

  const { items: events, replaceItem, ...state } = pagination;

  const applyEvent = useCallback(
    (next: FeedEvent) => replaceItem((event) => event.id === next.id, next),
    [replaceItem],
  );

  const isSearching = search.trim() !== debouncedSearch;

  return useMemo(
    () => ({
      ...state,
      events,
      filter,
      setFilter,
      reach,
      setReach,
      sort: effectiveSort,
      setSort,
      search,
      setSearch,
      isSearching,
      hasSearch: debouncedSearch.length > 0,
      applyEvent,
    }),
    [applyEvent, debouncedSearch, effectiveSort, events, filter, isSearching, reach, search, state],
  );
}
