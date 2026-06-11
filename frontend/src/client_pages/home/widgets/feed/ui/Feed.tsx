'use client';

import { useEffect, useRef } from 'react';
import { Spinner } from '@/shared';
import { useFeedEvents } from '@client_pages/home/model/useFeedEvents';
import { useFeedToolbarStore } from '@client_pages/home/model/useFeedToolbarStore';
import { EventCard } from './EventCard';
import { FeedEmptyState } from './FeedEmptyState';
import { FeedToolbar } from './FeedToolbar';
import s from './feed.module.scss';

export const Feed = () => {
  const filter = useFeedToolbarStore(state => state.filter);
  const reach = useFeedToolbarStore(state => state.reach);
  const sort = useFeedToolbarStore(state => state.sort);
  const setFilter = useFeedToolbarStore(state => state.setFilter);
  const setReach = useFeedToolbarStore(state => state.setReach);
  const setSort = useFeedToolbarStore(state => state.setSort);

  const { events, isLoading, isLoadingMore, hasMore, loadMore } =
    useFeedEvents();

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
          {events.map(event => (
            <EventCard key={event.id} event={event} />
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
