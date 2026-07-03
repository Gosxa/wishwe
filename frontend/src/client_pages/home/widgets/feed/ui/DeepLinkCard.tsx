'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@shared/ui/icons';
import { getEvent, GetEventError } from '@/shared/client_api/event';
import { toFeedEvents } from '@client_pages/home/model/feedMapper';
import type { FeedEvent } from '@client_pages/home/model/types';
import { EventCard } from './EventCard';
import s from './deepLinkCard.module.scss';

type Props = {
  eventId: string;
  onClose: () => void;
};

type LoadError = 'forbidden' | 'unavailable';

const NOTICE_DISMISS_MS = 4000;
const FORBIDDEN_DISMISS_MS = 10000;

const FORBIDDEN_MESSAGE =
  'This event is only visible to the creator’s friends. We’ve sent them a friend request for you — once they accept, you’ll see the event.';

export const DeepLinkCard = ({ eventId, onClose }: Props) => {
  const [event, setEvent] = useState<FeedEvent | null>(null);
  const [error, setError] = useState<LoadError | null>(null);

  useEffect(() => {
    let cancelled = false;

    getEvent(eventId)
      .then(fetched => {
        if (!cancelled) setEvent(toFeedEvents([fetched])[0]);
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        setError(
          err instanceof GetEventError && err.status === 403
            ? 'forbidden'
            : 'unavailable',
        );
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (!error) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const timeout = window.setTimeout(
      onClose,
      error === 'forbidden' ? FORBIDDEN_DISMISS_MS : NOTICE_DISMISS_MS,
    );

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [error, onClose]);

  if (error === 'forbidden') {
    return createPortal(
      <div className={s.toast} role="status">
        {FORBIDDEN_MESSAGE}
      </div>,
      document.body,
    );
  }

  if (error === 'unavailable') {
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
