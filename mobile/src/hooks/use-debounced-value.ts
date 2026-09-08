import { useEffect, useState } from 'react';

const DEFAULT_DELAY_MS = 300;

export function useDebouncedValue<T>(value: T, delayMs: number = DEFAULT_DELAY_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debounced;
}
