'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@shared/ui/icons';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { useModalTransition } from '@shared/hooks/useModalTransition';
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

const FORBIDDEN_DISMISS_MS = 10000;

const FORBIDDEN_MESSAGE =
  'This event is only visible to the host’s friends. Add them as a friend — once they accept, the event shows up in your feed.';

export const DeepLinkCard = ({ eventId, onClose }: Props) => {
  const [event, setEvent] = useState<FeedEvent | null>(null);
  const [error, setError] = useState<LoadError | null>(null);
  const hasClosed = useRef(false);
  const dismissTimeout = useRef<number | null>(null);
  const pulseModal = useModalAttention();

  const closeOnce = useCallback(() => {
    if (hasClosed.current) return;

    hasClosed.current = true;

    if (dismissTimeout.current !== null) {
      window.clearTimeout(dismissTimeout.current);
      dismissTimeout.current = null;
    }

    onClose();
  }, [onClose]);
  const { requestClose, modalTransitionProps } = useModalTransition(closeOnce);

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
    if (error !== 'forbidden') return;

    const timeout = window.setTimeout(closeOnce, FORBIDDEN_DISMISS_MS);

    dismissTimeout.current = timeout;

    return () => {
      window.clearTimeout(timeout);
      if (dismissTimeout.current === timeout) dismissTimeout.current = null;
    };
  }, [closeOnce, error]);

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
      <div {...modalTransitionProps} className={s.overlay} onClick={pulseModal}>
        <div
          data-modal-content
          className={s.notice}
          role="alertdialog"
          aria-modal="true"
          aria-describedby="unavailableEventMessage"
        >
          <p id="unavailableEventMessage" className={s.message}>
            This event isn’t available right now.
          </p>
          <button
            type="button"
            className={s.close}
            onClick={requestClose}
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
      onDetailsClose={closeOnce}
    />
  );
};
