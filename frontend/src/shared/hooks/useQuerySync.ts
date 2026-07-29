'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type QuerySyncMode = 'push' | 'replace';

let pending: { pathname: string; from: string; to: string } | null = null;
let consumers = 0;

export const useQuerySync = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const live = searchParams.toString();

  const liveRef = useRef(live);

  useEffect(() => {
    consumers += 1;

    return () => {
      consumers -= 1;

      if (consumers === 0) pending = null;
    };
  }, []);

  useEffect(() => {
    liveRef.current = live;

    if (!pending) return;

    const settled = pending.to === live;
    const inFlight = pending.pathname === pathname && pending.from === live;

    if (settled || !inFlight) pending = null;
  }, [live, pathname]);

  return useCallback(
    (
      mutate: (params: URLSearchParams) => void,
      mode: QuerySyncMode = 'replace',
    ) => {
      const current = liveRef.current;

      if (
        pending &&
        (pending.pathname !== pathname || pending.from !== current)
      )
        pending = null;

      const base = pending ? pending.to : current;
      const params = new URLSearchParams(base);

      mutate(params);

      const next = params.toString();

      if (next === base) return;

      pending = { pathname, from: current, to: next };

      const href = next ? `${pathname}?${next}` : pathname;

      if (mode === 'push') router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [router, pathname],
  );
};
