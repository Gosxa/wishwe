'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Spinner } from '@/shared';
import { useEventDeepLink } from '@shared/hooks/useEventDeepLink';
import { useSearchDisabledSync } from '@shared/hooks/useSearchDisabledSync';
import { useFeedEvents } from '@client_pages/home/model/useFeedEvents';
import { useFeedToolbar } from '@client_pages/home/model/useFeedToolbar';
import { SEARCH_PARAM } from '@client_pages/home/model/useFeedSearch';
import { DeepLinkCard } from './DeepLinkCard';
import { EventCard } from './EventCard';
import { FeedEmptyState } from './FeedEmptyState';
import { FeedToolbar } from './FeedToolbar';
import s from './feed.module.scss';

type Props = {
  onSearchDisabledChange?: (disabled: boolean) => void;
};

export const Feed = ({ onSearchDisabledChange }: Props) => {
  const { filter, reach, sort, setFilter, setReach, setSort } =
    useFeedToolbar();

  const { events, isLoading, isLoadingMore, hasMore, loadMore } =
    useFeedEvents();

  const search = useSearchParams().get(SEARCH_PARAM) ?? '';

  useSearchDisabledSync(onSearchDisabledChange, events, search);

  const { openEventId, setEventParam, clearEventParam, showDeepLinkCard } =
    useEventDeepLink(events, isLoading);

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
      {showDeepLinkCard && openEventId && (
        <DeepLinkCard eventId={openEventId} onClose={clearEventParam} />
      )}

      <div className={s.toolbarSlot}>
        <FeedToolbar
          activeFilter={filter}
          onFilterChange={setFilter}
          activeReach={reach}
          onReachChange={setReach}
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
          <FeedEmptyState filter={filter} />
        </div>
      ) : (
        <div className={s.list}>
          {events.map((event, position) => (
            <EventCard
              key={event.id}
              event={event}
              tourId={position === 0 ? 'feed-card' : undefined}
              enableDetails
              autoOpenDetails={event.id === openEventId}
              onDetailsOpen={() => setEventParam(event.id)}
              onDetailsClose={clearEventParam}
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
