'use client';

import { useEffect, useState } from 'react';
import { listEvents } from '@/shared/client_api/event';
import { toFeedEvents } from './feedMapper';
import type { FeedEvent } from './types';

export const useFeedEvents = () => {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listEvents()
      .then(backendEvents => {
        if (active) setEvents(toFeedEvents(backendEvents));
      })
      .catch(() => {
        if (active) setError('Failed to load events');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { events, isLoading, error };
};
