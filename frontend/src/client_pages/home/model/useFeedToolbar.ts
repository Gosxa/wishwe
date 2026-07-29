'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuerySync } from '@shared/hooks/useQuerySync';
import type { FeedFilter, FeedReach, SortOption } from './types';

type Toolbar = { filter: FeedFilter; reach: FeedReach; sort: SortOption };

export const FILTER_PARAM = 'filter';
export const REACH_PARAM = 'reach';
export const SORT_PARAM = 'sort';

const DEFAULT_FILTER: FeedFilter = 'all';
const DEFAULT_REACH: FeedReach = 'all';
const DEFAULT_SORT: SortOption = 'recent';

const FILTERS: FeedFilter[] = ['all', 'plans', 'wishes'];
const REACHES: FeedReach[] = ['all', 'direct'];
const SORTS: SortOption[] = ['soonest', 'recent', 'heat'];

const parseFilter = (value: string | null): FeedFilter => {
  if (value && FILTERS.includes(value as FeedFilter))
    return value as FeedFilter;

  return DEFAULT_FILTER;
};

const parseReach = (value: string | null): FeedReach => {
  if (value && REACHES.includes(value as FeedReach)) return value as FeedReach;

  return DEFAULT_REACH;
};

const parseSort = (value: string | null): SortOption => {
  if (value && SORTS.includes(value as SortOption)) return value as SortOption;

  return DEFAULT_SORT;
};

const normalizeToolbar = ({ filter, reach, sort }: Toolbar): Toolbar => ({
  filter,
  reach,
  sort: filter === 'all' && sort === 'heat' ? 'recent' : sort,
});

const readToolbar = (params: URLSearchParams): Toolbar =>
  normalizeToolbar({
    filter: parseFilter(params.get(FILTER_PARAM)),
    reach: parseReach(params.get(REACH_PARAM)),
    sort: parseSort(params.get(SORT_PARAM)),
  });

const applyToolbarToParams = (params: URLSearchParams, toolbar: Toolbar) => {
  const { filter, reach, sort } = normalizeToolbar(toolbar);

  if (filter === DEFAULT_FILTER) params.delete(FILTER_PARAM);
  else params.set(FILTER_PARAM, filter);

  if (reach === DEFAULT_REACH) params.delete(REACH_PARAM);
  else params.set(REACH_PARAM, reach);

  if (sort === DEFAULT_SORT) params.delete(SORT_PARAM);
  else params.set(SORT_PARAM, sort);
};

export const useFeedToolbar = () => {
  const searchParams = useSearchParams();
  const updateQuery = useQuerySync();

  const { filter, reach, sort } = readToolbar(searchParams);

  const patchToolbar = useCallback(
    (patch: Partial<Toolbar>) => {
      updateQuery(
        params =>
          applyToolbarToParams(params, { ...readToolbar(params), ...patch }),
        'push',
      );
    },
    [updateQuery],
  );

  const setFilter = useCallback(
    (filter: FeedFilter) => patchToolbar({ filter }),
    [patchToolbar],
  );

  const setReach = useCallback(
    (reach: FeedReach) => patchToolbar({ reach }),
    [patchToolbar],
  );

  const setSort = useCallback(
    (sort: SortOption) => patchToolbar({ sort }),
    [patchToolbar],
  );

  return { filter, reach, sort, setFilter, setReach, setSort };
};
