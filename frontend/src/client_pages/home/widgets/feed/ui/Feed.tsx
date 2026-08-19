'use client';

import { useSearchParams } from 'next/navigation';
import { EventFeedLayout } from '@widgets/eventFeed';
import { useEventDeepLink } from '@shared/hooks/useEventDeepLink';
import { useSearchDisabledSync } from '@shared/hooks/useSearchDisabledSync';
import { useFeedEvents } from '@client_pages/home/model/useFeedEvents';
import { useFeedToolbar } from '@client_pages/home/model/useFeedToolbar';
import { SEARCH_PARAM } from '@client_pages/home/model/useFeedSearch';
import { DeepLinkCard } from './DeepLinkCard';
import { EventCard } from './EventCard';
import { FeedEmptyState } from './FeedEmptyState';
import { FeedToolbar } from './FeedToolbar';

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

  return (
    <EventFeedLayout
      variant="home"
      before={
        showDeepLinkCard && openEventId ? (
          <DeepLinkCard eventId={openEventId} onClose={clearEventParam} />
        ) : null
      }
      toolbar={
        <FeedToolbar
          activeFilter={filter}
          onFilterChange={setFilter}
          activeReach={reach}
          onReachChange={setReach}
          activeSort={sort}
          onSortChange={setSort}
        />
      }
      isLoading={isLoading}
      isEmpty={events.length === 0}
      emptyState={<FeedEmptyState filter={filter} />}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      loadMore={loadMore}
    >
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
    </EventFeedLayout>
  );
};
