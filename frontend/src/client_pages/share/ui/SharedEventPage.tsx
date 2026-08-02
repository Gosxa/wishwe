'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SharedEventResponse } from '@/shared/client_api/event';
import type { FriendshipStatus } from '@/shared/client_api/user/types';
import { HomePage } from '@client_pages/home';
import { toFeedEvents } from '@client_pages/home/model/feedMapper';
import { EventCard } from '@client_pages/home/widgets/feed/ui/EventCard';
import { EventPreviewModal } from './EventPreviewModal';
import { ShareErrorModal } from './ShareErrorModal';

type Props = {
  shared: SharedEventResponse | null;
  creatorFriendshipStatus: FriendshipStatus | null;
};

export default function SharedEventPage({
  shared,
  creatorFriendshipStatus,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const close = useCallback(() => {
    setIsOpen(false);
    router.replace('/feed', { scroll: false });
  }, [router]);

  const event =
    shared && shared.has_access ? toFeedEvents([shared.event])[0] : null;
  const preview = shared && !shared.has_access ? shared.preview : null;

  const renderModal = () => {
    if (!isOpen) {
      return null;
    }

    if (event) {
      return (
        <EventCard
          event={event}
          enableDetails
          autoOpenDetails
          detailsOnly
          onDetailsClose={close}
        />
      );
    }

    if (preview) {
      return (
        <EventPreviewModal
          preview={preview}
          friendshipStatus={creatorFriendshipStatus}
          onClose={close}
        />
      );
    }

    return <ShareErrorModal onClose={close} />;
  };

  return (
    <>
      <HomePage />
      {renderModal()}
    </>
  );
}
