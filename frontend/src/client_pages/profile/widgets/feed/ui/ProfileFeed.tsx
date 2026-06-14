'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Spinner } from '@/shared';
import type { Profile } from '@/shared/client_api/auth/types';
import { getEvent } from '@/shared/client_api/event';
import type { BackendEvent } from '@/shared/client_api/event';
import { useSearchDisabledSync } from '@shared/hooks/useSearchDisabledSync';
import { useUserStore } from '@/shared/store/useUserStore';
import { EventCard } from '@client_pages/home/widgets/feed/ui/EventCard';
import { EditEventModal } from '@client_pages/profile/widgets/editEventModal';
import { PlanItModal } from '@client_pages/profile/widgets/planItModal';
import { useProfileEvents } from '@client_pages/profile/model/useProfileEvents';
import { SEARCH_PARAM } from '@client_pages/profile/model/useProfileSearch';
import type {
  ProfileSort,
  ProfileTab,
} from '@client_pages/profile/model/types';
import { ProfileFeedToolbar } from './ProfileFeedToolbar';
import { ProfileFeedEmptyState } from './ProfileFeedEmptyState';
import s from './profileFeed.module.scss';

type Props = {
  initialUser: Profile | null;
  onSearchDisabledChange?: (disabled: boolean) => void;
};

export const ProfileFeed = ({ initialUser, onSearchDisabledChange }: Props) => {
  const [tab, setTab] = useState<ProfileTab>('plans');
  const [sort, setSort] = useState<ProfileSort>('recent');

  const user = useUserStore(state => state.user) ?? initialUser;

  const username = user?.username;
  const currentHandle = username ? `@${username}` : null;

  const [editingEvent, setEditingEvent] = useState<BackendEvent | null>(null);
  const [planningEvent, setPlanningEvent] = useState<BackendEvent | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { events, isLoading, isLoadingMore, hasMore, loadMore } =
    useProfileEvents({ userId: user?.user_id ?? null, tab, sort, refreshKey });

  const search = useSearchParams().get(SEARCH_PARAM) ?? '';

  useSearchDisabledSync(onSearchDisabledChange, events, search);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleEditOpen = useCallback(async (id: string) => {
    try {
      setEditingEvent(await getEvent(id));
    } catch {
      // network failure — leave the modal closed
    }
  }, []);

  const handleEventSaved = useCallback(() => {
    setEditingEvent(null);
    setRefreshKey(key => key + 1);
  }, []);

  const handlePlanItOpen = useCallback(async (id: string) => {
    try {
      setPlanningEvent(await getEvent(id));
    } catch {}
  }, []);

  const handlePlanItConverted = useCallback(() => {
    setPlanningEvent(null);
    setTab('plans');
    setRefreshKey(key => key + 1);
  }, []);

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
              isArchived={tab === 'archive'}
              showEventType={false}
              onEdit={handleEditOpen}
              onPlanIt={handlePlanItOpen}
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

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={handleEventSaved}
        />
      )}

      {planningEvent && (
        <PlanItModal
          event={planningEvent}
          onClose={() => setPlanningEvent(null)}
          onConverted={handlePlanItConverted}
        />
      )}
    </div>
  );
};
