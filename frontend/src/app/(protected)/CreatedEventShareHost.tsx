'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toFeedEvents } from '@entities/event';
import { ShareEventModal } from '@widgets/eventCard';
import { useCreatedEventShareStore } from '@/shared/store/useCreatedEventShareStore';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';

export const CreatedEventShareHost = () => {
  const createdEvent = useCreatedEventShareStore(state => state.event);
  const close = useCreatedEventShareStore(state => state.close);
  const flushRefresh = useEventsRefreshStore(state => state.flushRefresh);
  const returnFocusRef = useRef<HTMLButtonElement>(null);
  const event = useMemo(
    () => (createdEvent ? toFeedEvents([createdEvent])[0] : null),
    [createdEvent],
  );

  const handleClose = useCallback(() => {
    close();
    flushRefresh();
  }, [close, flushRefresh]);

  useEffect(() => flushRefresh, [flushRefresh]);

  if (!event) return null;

  return createPortal(
    <ShareEventModal
      event={event}
      isOwn
      onClose={handleClose}
      returnFocusRef={returnFocusRef}
      celebrateArrival
    />,
    document.body,
  );
};
