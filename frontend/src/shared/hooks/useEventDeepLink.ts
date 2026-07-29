'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuerySync } from './useQuerySync';

const EVENT_PARAM = 'event';

type LoadedEvent = { id: string };

export const useEventDeepLink = (
  loadedEvents: LoadedEvent[],
  isFeedLoading = false,
) => {
  const searchParams = useSearchParams();
  const updateQuery = useQuerySync();

  const openEventId = searchParams.get(EVENT_PARAM);

  const setEventParam = useCallback(
    (id: string) => {
      updateQuery(params => params.set(EVENT_PARAM, id));
    },
    [updateQuery],
  );

  const clearEventParam = useCallback(() => {
    updateQuery(params => params.delete(EVENT_PARAM));
  }, [updateQuery]);

  const isLinkedEventLoaded = loadedEvents.some(
    event => event.id === openEventId,
  );

  const showDeepLinkCard =
    Boolean(openEventId) && !isFeedLoading && !isLinkedEventLoaded;

  return { openEventId, setEventParam, clearEventParam, showDeepLinkCard };
};
