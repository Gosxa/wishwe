'use client';

import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/shared';
import type { Profile } from '@/shared/client_api/auth/types';
import { useUserStore } from '@/shared/store/useUserStore';
import { EventCard } from '@client_pages/home/widgets/feed/ui/EventCard';
import { useProfileEvents } from '@client_pages/profile/model/useProfileEvents';
import type {
  ProfileSort,
  ProfileTab,
} from '@client_pages/profile/model/types';
import { ProfileFeedToolbar } from './ProfileFeedToolbar';
import { ProfileFeedEmptyState } from './ProfileFeedEmptyState';
import s from './profileFeed.module.scss';

type Props = {
  initialUser: Profile | null;
};

export const ProfileFeed = ({ initialUser }: Props) => {
  const [tab, setTab] = useState<ProfileTab>('plans');
  const [sort, setSort] = useState<ProfileSort>('recent');

  // Prefer the live store (picks up in-session edits) but fall back to the
  // server-fetched user so the first events request doesn't wait for the
  // client store to hydrate.
  const user = useUserStore(state => state.user) ?? initialUser;

  const username = user?.username;
  const currentHandle = username ? `@${username}` : null;

  const { events, isLoading, isLoadingMore, hasMore, loadMore } =
    useProfileEvents({ userId: user?.user_id ?? null, tab, sort });

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

      {isLoading ? (
        <div className={s.statusSlot}>
          <Spinner />
        </div>
      ) : events.length === 0 ? (
        <div className={s.emptySlot}>
          <ProfileFeedEmptyState tab={tab} />
        </div>
      ) : (
        <div className={s.list}>
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isOwn={
                currentHandle != null && event.host.username === currentHandle
              }
            />
          ))}
          {hasMore && <div ref={sentinelRef} className={s.sentinel} />}
          {isLoadingMore && (
            <div className={s.statusSlot}>
              <Spinner />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
