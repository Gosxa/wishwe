'use client';

import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/shared';
import type { PublicProfile } from '@/shared/client_api/user/types';
import { EventCard } from '@client_pages/home/widgets/feed/ui/EventCard';
import { useProfileEvents } from '@client_pages/profile/model/useProfileEvents';
import { ProfileFeedToolbar } from '@client_pages/profile/widgets/feed/ui/ProfileFeedToolbar';
import type {
  ProfileSort,
  ProfileTab,
} from '@client_pages/profile/model/types';
import s from '@client_pages/profile/widgets/feed/ui/profileFeed.module.scss';
import { UserProfileEmptyState } from './UserProfileEmptyState';

type Props = {
  profile: PublicProfile;
};

export const UserProfileFeed = ({ profile }: Props) => {
  const [tab, setTab] = useState<ProfileTab>('plans');
  const [sort, setSort] = useState<ProfileSort>('recent');

  const { events, isLoading, isLoadingMore, hasMore, loadMore } =
    useProfileEvents({ userId: profile.user_id, tab, sort });

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
          showArchive={false}
        />
      </div>

      {isLoading ? (
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
              enableDetails
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
