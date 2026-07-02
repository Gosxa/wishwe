'use client';

import { useEffect, useState } from 'react';
import { searchProfiles } from '@/shared/client_api/user';
import { toSearchResult } from './mappers';
import type { SearchResult } from './types';

const DEBOUNCE_MS = 350;

type SearchState = {
  query: string;
  results: SearchResult[];
  hasMore: boolean;
  error: string | null;
};

const EMPTY: SearchState = {
  query: '',
  results: [],
  hasMore: false,
  error: null,
};

export const useUserSearch = (query: string) => {
  const [state, setState] = useState<SearchState>(EMPTY);
  const q = query.trim();

  useEffect(() => {
    if (!q) return;

    let active = true;

    const timer = setTimeout(() => {
      searchProfiles(q)
        .then(data => {
          if (!active) return;

          setState({
            query: q,
            results: data.results.map(toSearchResult),
            hasMore: Boolean(data.next),
            error: null,
          });
        })
        .catch(() => {
          if (!active) return;

          setState({
            query: q,
            results: [],
            hasMore: false,
            error: 'Failed to search people',
          });
        });
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q]);

  const isSettled = state.query === q;

  return {
    results: q ? state.results : [],
    hasMore: q && isSettled ? state.hasMore : false,
    isSearching: Boolean(q) && !isSettled,
    error: q && isSettled ? state.error : null,
  };
};
