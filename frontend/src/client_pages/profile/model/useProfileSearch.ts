'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebouncedSearch } from '@shared/hooks/useDebouncedSearch';

export const SEARCH_PARAM = 'title';

/**
 * Syncs the profile search box with the `title` URL query param; pressing Enter
 * commits immediately.
 *
 * Unlike the home feed — which searches every visible event — the profile feed
 * reads this param to filter only the current user's own events, so the search
 * here is scoped to "my events".
 */
export const useProfileSearch = () => {
  const searchParams = useSearchParams();
  const committed = searchParams.get(SEARCH_PARAM) ?? '';
  const commit = useCallback((value: string) => {
    const params = new URLSearchParams(window.location.search);

    if (value) params.set(SEARCH_PARAM, value);
    else params.delete(SEARCH_PARAM);

    const queryString = params.toString();
    const url = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    window.history.replaceState(null, '', url);
  }, []);

  return useDebouncedSearch(committed, commit);
};
