'use client';

import { useEffect } from 'react';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';

const MODERATION_REFRESH_INTERVAL_MS = 5000;
const MAX_MODERATION_REFRESH_MS = 3 * 60 * 1000;

export const useModerationRefresh = (hasPendingModeration: boolean) => {
  const requestRefresh = useEventsRefreshStore(state => state.requestRefresh);

  useEffect(() => {
    if (!hasPendingModeration) return;

    const interval = window.setInterval(
      requestRefresh,
      MODERATION_REFRESH_INTERVAL_MS,
    );
    const timeout = window.setTimeout(
      () => window.clearInterval(interval),
      MAX_MODERATION_REFRESH_MS,
    );

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [hasPendingModeration, requestRefresh]);
};
