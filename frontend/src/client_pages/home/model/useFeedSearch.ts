'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuerySync } from '@shared/hooks/useQuerySync';

export const SEARCH_PARAM = 'title';

const DEBOUNCE_MS = 500;

export const useFeedSearch = () => {
  const searchParams = useSearchParams();
  const updateQuery = useQuerySync();
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

  const commit = useCallback(
    (next: string) => {
      const trimmed = next.trim();

      updateQuery(params => {
        if (trimmed) params.set(SEARCH_PARAM, trimmed);
        else params.delete(SEARCH_PARAM);
      });
    },
    [updateQuery],
  );

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
