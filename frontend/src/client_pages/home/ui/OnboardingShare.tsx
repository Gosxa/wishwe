'use client';

import { useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOnboardingStore } from '@/shared/store/useOnboardingStore';
import { toFeedEvents } from '../model/feedMapper';
import { ShareEventModal } from '../widgets/feed/ui/ShareEventModal';

export const OnboardingShare = () => {
  const createdEvent = useOnboardingStore(state => state.createdEvent);
  const dismissShare = useOnboardingStore(state => state.dismissShare);
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
      onClose={dismissShare}
      returnFocusRef={returnFocusRef}
    />,
    document.body,
  );
};
