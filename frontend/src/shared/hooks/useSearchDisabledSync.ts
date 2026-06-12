'use client';

import { useEffect } from 'react';

export const useSearchDisabledSync = (
  onChange: ((disabled: boolean) => void) | undefined,
  events: unknown[],
  searchQuery: string,
) => {
  useEffect(() => {
    if (!onChange) return;

    onChange(events.length === 0 && !searchQuery.trim());

    return () => onChange(false);
  }, [events.length, searchQuery, onChange]);
};
