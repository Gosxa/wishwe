'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuerySync } from '@shared/hooks/useQuerySync';
import type { ProfileSort, ProfileTab } from './types';

type Toolbar = { tab: ProfileTab; sort: ProfileSort };

export const FILTER_PARAM = 'filter';
export const SORT_PARAM = 'sort';

const DEFAULT_TAB: ProfileTab = 'plans';
const DEFAULT_SORT: ProfileSort = 'recent';

const TABS: ProfileTab[] = ['plans', 'wishes', 'archive'];
const SORTS: ProfileSort[] = ['recent', 'soonest'];

const parseTab = (value: string | null): ProfileTab => {
  if (value && TABS.includes(value as ProfileTab)) return value as ProfileTab;

  return DEFAULT_TAB;
};

const parseSort = (value: string | null): ProfileSort => {
  if (value && SORTS.includes(value as ProfileSort))
    return value as ProfileSort;

  return DEFAULT_SORT;
};

const readToolbar = (params: URLSearchParams): Toolbar => ({
  tab: parseTab(params.get(FILTER_PARAM)),
  sort: parseSort(params.get(SORT_PARAM)),
});

const applyToolbarToParams = (params: URLSearchParams, toolbar: Toolbar) => {
  if (toolbar.tab === DEFAULT_TAB) params.delete(FILTER_PARAM);
  else params.set(FILTER_PARAM, toolbar.tab);

  if (toolbar.sort === DEFAULT_SORT) params.delete(SORT_PARAM);
  else params.set(SORT_PARAM, toolbar.sort);
};

export const useProfileToolbar = () => {
  const searchParams = useSearchParams();
  const updateQuery = useQuerySync();

  const { tab, sort } = readToolbar(searchParams);

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

  const setTab = useCallback(
    (tab: ProfileTab) => patchToolbar({ tab }),
    [patchToolbar],
  );

  const setSort = useCallback(
    (sort: ProfileSort) => patchToolbar({ sort }),
    [patchToolbar],
  );

  return { tab, sort, setTab, setSort };
};
