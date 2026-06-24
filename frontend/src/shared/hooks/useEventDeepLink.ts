'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const EVENT_PARAM = 'event';

type LoadedEvent = { id: string };

export const useEventDeepLink = (loadedEvents: LoadedEvent[]) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const openEventId = searchParams.get(EVENT_PARAM);

  const setEventParam = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set(EVENT_PARAM, id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const clearEventParam = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete(EVENT_PARAM);

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [router, pathname, searchParams]);

  const isLinkedEventLoaded = loadedEvents.some(
    event => event.id === openEventId,
  );
  const showDeepLinkCard = Boolean(openEventId) && !isLinkedEventLoaded;

  return { openEventId, setEventParam, clearEventParam, showDeepLinkCard };
};
