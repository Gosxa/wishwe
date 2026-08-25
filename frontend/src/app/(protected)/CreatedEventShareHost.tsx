'use client';

import { useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toFeedEvents } from '@client_pages/home/model/feedMapper';
import { ShareEventModal } from '@client_pages/home/widgets/feed/ui/ShareEventModal';
import { useCreatedEventShareStore } from '@/shared/store/useCreatedEventShareStore';

export const CreatedEventShareHost = () => {
  const createdEvent = useCreatedEventShareStore(state => state.event);
  const close = useCreatedEventShareStore(state => state.close);
  const returnFocusRef = useRef<HTMLButtonElement>(null);
  const event = useMemo(
    () => (createdEvent ? toFeedEvents([createdEvent])[0] : null),
    [createdEvent],
  );

  if (!event) return null;

  return createPortal(
    <ShareEventModal
      event={event}
      isOwn
      onClose={close}
      returnFocusRef={returnFocusRef}
      celebrateArrival
    />,
    document.body,
  );
};
