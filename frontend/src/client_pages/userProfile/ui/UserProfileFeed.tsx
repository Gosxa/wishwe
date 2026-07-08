'use client';

import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/shared';
import type {
  FriendshipStatus,
  PublicProfile,
} from '@/shared/client_api/user/types';
import { EventCard } from '@client_pages/home/widgets/feed/ui/EventCard';
import { useProfileEvents } from '@client_pages/profile/model/useProfileEvents';
import { ProfileFeedToolbar } from '@client_pages/profile/widgets/feed/ui/ProfileFeedToolbar';
import type {
  ProfileSort,
  ProfileTab,
} from '@client_pages/profile/model/types';
import s from '@client_pages/profile/widgets/feed/ui/profileFeed.module.scss';
import { UserProfileEmptyState } from './UserProfileEmptyState';
import { FriendsOnlyState } from './FriendsOnlyState';

type Props = {
  profile: PublicProfile;
  friendshipStatus: FriendshipStatus;
};

export const UserProfileFeed = ({ profile, friendshipStatus }: Props) => {
  const [tab, setTab] = useState<ProfileTab>('plans');
  const [sort, setSort] = useState<ProfileSort>('recent');

  const canSeeEvents =
    friendshipStatus === 'friends' || friendshipStatus === 'self';

  const { events, isLoading, isLoadingMore, hasMore, loadMore } =
    useProfileEvents({
      userId: profile.user_id,
      tab,
      sort,
      enabled: canSeeEvents,
    });

  const isArchive = tab === 'archive';

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className={s.feed}>
      <div className={s.toolbarSlot}>
        <ProfileFeedToolbar
          activeTab={tab}
          onTabChange={setTab}
          activeSort={sort}
          onSortChange={setSort}
        />
      </div>

      {!canSeeEvents ? (
        <div className={s.emptySlot}>
          <FriendsOnlyState username={profile.username ?? ''} />
        </div>
      ) : isLoading ? (
        <div className={s.statusSlot}>
          <Spinner />
        </div>
      ) : events.length === 0 ? (
        <div className={s.emptySlot}>
          <UserProfileEmptyState tab={tab} />
        </div>
      ) : (
        <div className={s.list}>
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isOwn={false}
              isArchived={isArchive}
              enableDetails={!isArchive}
              showEventType={false}
              showChat
            />
          ))}
          {hasMore && <div ref={sentinelRef} className={s.sentinel} />}
          {isLoadingMore && (
            <div className={s.statusSlot}>
              <Spinner inline />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
