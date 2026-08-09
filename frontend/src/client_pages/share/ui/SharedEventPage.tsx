'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SharedEventResponse } from '@/shared/client_api/event';
import type { FriendshipStatus } from '@/shared/client_api/user/types';
import { HomePage } from '@client_pages/home';
import { LandingPage } from '@client_pages/landing';
import { toFeedEvents } from '@client_pages/home/model/feedMapper';
import { EventCard } from '@client_pages/home/widgets/feed/ui/EventCard';
import { EventPreviewModal } from './EventPreviewModal';
import { ShareErrorModal } from './ShareErrorModal';

type Props = {
  shared: { status: 'ok'; data: SharedEventResponse } | { status: 'not-found' };
  isAuthenticated: boolean;
  loginHref: string;
  creatorFriendshipStatus: FriendshipStatus | null;
};

export default function SharedEventPage({
  shared,
  isAuthenticated,
  loginHref,
  creatorFriendshipStatus,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const close = useCallback(() => {
    setIsOpen(false);
    router.replace(isAuthenticated ? '/feed' : '/', { scroll: false });
  }, [isAuthenticated, router]);

  const data = shared.status === 'ok' ? shared.data : null;
  const event = data && data.has_access ? toFeedEvents([data.event])[0] : null;
  const preview = data && !data.has_access ? data.preview : null;

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
          isAuthenticated={isAuthenticated}
          loginHref={loginHref}
          friendshipStatus={creatorFriendshipStatus}
          onClose={close}
        />
      );
    }

    return (
      <ShareErrorModal
        onClose={close}
        actionLabel={isAuthenticated ? 'Go to feed' : 'Go to home'}
      />
    );
  };

  return (
    <>
      {isAuthenticated ? <HomePage showTour={false} /> : <LandingPage />}
      {renderModal()}
    </>
  );
}
