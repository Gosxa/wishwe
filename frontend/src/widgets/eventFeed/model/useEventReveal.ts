'use client';

import { useEffect } from 'react';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';

export const useEventReveal = (eventIds: string[]) => {
  const revealEventId = useEventsRefreshStore(state => state.revealEventId);
  const clearReveal = useEventsRefreshStore(state => state.clearReveal);
  const isPresent = revealEventId !== null && eventIds.includes(revealEventId);

  useEffect(() => {
    if (isPresent) clearReveal();
  }, [clearReveal, isPresent]);

  return isPresent ? revealEventId : null;
};
