'use client';

import { useEffect, useState } from 'react';
import { getEvent } from '@/shared/client_api/event';
import { toFeedEvents } from '@client_pages/home/model/feedMapper';
import type { FeedEvent } from '@client_pages/home/model/types';
import { EventCard } from './EventCard';

type Props = {
  eventId: string;
  onClose: () => void;
};

export const DeepLinkCard = ({ eventId, onClose }: Props) => {
  const [event, setEvent] = useState<FeedEvent | null>(null);

  useEffect(() => {
    let cancelled = false;

    getEvent(eventId)
      .then(fetched => {
        if (!cancelled) setEvent(toFeedEvents([fetched])[0]);
      })
      .catch(() => {
        if (!cancelled) onClose();
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, onClose]);

  if (!event) return null;

  return (
    <EventCard
      event={event}
      enableDetails
      autoOpenDetails
      detailsOnly
      onDetailsClose={onClose}
    />
  );
};
