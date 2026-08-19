'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 500;

export const useDebouncedSearch = (
  committed: string,
  commitValue: (value: string) => void,
) => {
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
    (next: string) => commitValue(next.trim()),
    [commitValue],
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

  useEffect(() => {
    clearTimer();

    return clearTimer;
  }, [clearTimer, committed]);

  return { value, onChange, onSearch };
};
