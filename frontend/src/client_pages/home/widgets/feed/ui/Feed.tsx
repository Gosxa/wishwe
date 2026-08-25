'use client';

import { useSearchParams } from 'next/navigation';
import {
  EventFeedItem,
  EventFeedLayout,
  useEventReveal,
} from '@widgets/eventFeed';
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

  const { events, isLoading, isLoadingMore, hasMore, loadMore, error, retry } =
    useFeedEvents();

  const search = useSearchParams().get(SEARCH_PARAM) ?? '';

  useSearchDisabledSync(onSearchDisabledChange, events, search);

  const revealEventId = useEventReveal(events.map(event => event.id));

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
      error={error}
      onRetry={retry}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      loadMore={loadMore}
    >
      {events.map((event, position) => (
        <EventFeedItem key={event.id} reveal={event.id === revealEventId}>
          <EventCard
            event={event}
            tourId={position === 0 ? 'feed-card' : undefined}
            enableDetails
            autoOpenDetails={event.id === openEventId}
            onDetailsOpen={() => setEventParam(event.id)}
            onDetailsClose={clearEventParam}
          />
        </EventFeedItem>
      ))}
    </EventFeedLayout>
  );
};
