'use client';

import { DeepLinkCard } from '@client_pages/home/widgets/feed/ui/DeepLinkCard';
import { useEventModalStore } from '@/shared/store/useEventModalStore';

export const EventModalHost = () => {
  const eventId = useEventModalStore(state => state.eventId);
  const close = useEventModalStore(state => state.close);

  if (!eventId) return null;

  return <DeepLinkCard eventId={eventId} onClose={close} />;
};
