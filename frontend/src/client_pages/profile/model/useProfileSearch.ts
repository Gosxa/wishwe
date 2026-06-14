'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export const SEARCH_PARAM = 'title';

const DEBOUNCE_MS = 500;

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

  const [value, setValue] = useState(committed);
  const [lastCommitted, setLastCommitted] = useState(committed);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (committed !== lastCommitted) {
    setLastCommitted(committed);
    if (value.trim() !== committed) setValue(committed);
  }

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const commit = useCallback((next: string) => {
    const params = new URLSearchParams(window.location.search);
    const trimmed = next.trim();

    if (trimmed) params.set(SEARCH_PARAM, trimmed);
    else params.delete(SEARCH_PARAM);

    const queryString = params.toString();
    const url = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    window.history.replaceState(null, '', url);
  }, []);

  const onChange = useCallback(
    (next: string) => {
      setValue(next);
      clearTimer();
      timerRef.current = setTimeout(() => commit(next), DEBOUNCE_MS);
    },
    [clearTimer, commit],
  );

  const onSearch = useCallback(
    (next: string) => {
      clearTimer();
      commit(next);
    },
    [clearTimer, commit],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return { value, onChange, onSearch };
};
