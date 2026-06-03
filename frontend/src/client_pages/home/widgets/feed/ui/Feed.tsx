'use client';

import type {
  FeedEvent,
  FeedFilter,
  FeedReach,
  SortOption,
} from '@client_pages/home/model/types';
import { useFeedToolbarStore } from '@client_pages/home/model/useFeedToolbarStore';
import { EventCard } from './EventCard';
import { FeedEmptyState } from './FeedEmptyState';
import { FeedToolbar } from './FeedToolbar';
import s from './feed.module.scss';

type Props = {
  events: FeedEvent[];
};

const matchesFilter = (event: FeedEvent, filter: FeedFilter) => {
  if (filter === 'plans') return event.type === 'plan';
  if (filter === 'wishes') return event.type === 'wish';

  return true;
};

const matchesReach = (event: FeedEvent, reach: FeedReach) => {
  if (reach === 'direct') return !event.host.mutualFriend;

  return true;
};

const compareSoonest = (a: FeedEvent, b: FeedEvent) => {
  if (a.startsAt === b.startsAt) return 0;
  if (a.startsAt === null) return 1;
  if (b.startsAt === null) return -1;

  return a.startsAt - b.startsAt;
};

const sorters: Record<SortOption, (a: FeedEvent, b: FeedEvent) => number> = {
  soonest: compareSoonest,
  recent: (a, b) => b.createdAt - a.createdAt,
  heat: (a, b) => b.participantCount - a.participantCount,
};

export const Feed = ({ events }: Props) => {
  const filter = useFeedToolbarStore(state => state.filter);
  const reach = useFeedToolbarStore(state => state.reach);
  const sort = useFeedToolbarStore(state => state.sort);
  const setFilter = useFeedToolbarStore(state => state.setFilter);
  const setReach = useFeedToolbarStore(state => state.setReach);
  const setSort = useFeedToolbarStore(state => state.setSort);

  const visibleEvents = events
    .filter(event => matchesFilter(event, filter) && matchesReach(event, reach))
    .sort(sorters[sort]);

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
      {visibleEvents.length === 0 ? (
        <div className={s.emptySlot}>
          <FeedEmptyState filter={filter} />
        </div>
      ) : (
        <div className={s.list}>
          {visibleEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
