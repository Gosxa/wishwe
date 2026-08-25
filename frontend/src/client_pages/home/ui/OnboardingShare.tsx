'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOnboardingStore } from '@/shared/store/useOnboardingStore';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';
import { toFeedEvents } from '../model/feedMapper';
import { ShareEventModal } from '../widgets/feed/ui/ShareEventModal';

export const OnboardingShare = () => {
  const createdEvent = useOnboardingStore(state => state.createdEvent);
  const dismissShare = useOnboardingStore(state => state.dismissShare);
  const flushRefresh = useEventsRefreshStore(state => state.flushRefresh);
  const returnFocusRef = useRef<HTMLButtonElement>(null);

  const event = useMemo(
    () => (createdEvent ? toFeedEvents([createdEvent])[0] : null),
    [createdEvent],
  );

  const handleClose = useCallback(() => {
    dismissShare();
    flushRefresh();
  }, [dismissShare, flushRefresh]);

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
