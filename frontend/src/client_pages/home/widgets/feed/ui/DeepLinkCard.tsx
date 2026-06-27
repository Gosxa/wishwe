'use client';

import { useEffect, useState } from 'react';
import { X } from '@shared/ui/icons';
import { getEvent } from '@/shared/client_api/event';
import { toFeedEvents } from '@client_pages/home/model/feedMapper';
import type { FeedEvent } from '@client_pages/home/model/types';
import { EventCard } from './EventCard';
import s from './deepLinkCard.module.scss';

type Props = {
  eventId: string;
  onClose: () => void;
};

const NOTICE_DISMISS_MS = 4000;

export const DeepLinkCard = ({ eventId, onClose }: Props) => {
  const [event, setEvent] = useState<FeedEvent | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getEvent(eventId)
      .then(fetched => {
        if (!cancelled) setEvent(toFeedEvents([fetched])[0]);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (!hasError) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const timeout = window.setTimeout(onClose, NOTICE_DISMISS_MS);

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasError, onClose]);

  if (hasError) {
    return (
      <div className={s.overlay} onClick={onClose}>
        <div
          className={s.notice}
          role="alert"
          onClick={e => e.stopPropagation()}
        >
          <p className={s.message}>This event isn’t available right now.</p>
          <button
            type="button"
            className={s.close}
            onClick={onClose}
            aria-label="Dismiss"
          >
            <X />
          </button>
        </div>
      </div>
    );
  }

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
