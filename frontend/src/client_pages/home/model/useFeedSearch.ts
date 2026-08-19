'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebouncedSearch } from '@shared/hooks/useDebouncedSearch';
import { useQuerySync } from '@shared/hooks/useQuerySync';

export const SEARCH_PARAM = 'title';

export const useFeedSearch = () => {
  const searchParams = useSearchParams();
  const updateQuery = useQuerySync();
  const committed = searchParams.get(SEARCH_PARAM) ?? '';
  const commit = useCallback(
    (value: string) => {
      updateQuery(params => {
        if (value) params.set(SEARCH_PARAM, value);
        else params.delete(SEARCH_PARAM);
      });
    },
    [updateQuery],
  );

  return useDebouncedSearch(committed, commit);
};
