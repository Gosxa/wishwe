'use client';

import type {
  FriendshipStatus,
  PublicProfile,
} from '@/shared/client_api/user/types';
import { EventFeedLayout } from '@widgets/eventFeed';
import { EventCard } from '@client_pages/home/widgets/feed/ui/EventCard';
import { useProfileEvents } from '@client_pages/profile/model/useProfileEvents';
import { useProfileToolbar } from '@client_pages/profile/model/useProfileToolbar';
import { ProfileFeedToolbar } from '@client_pages/profile/widgets/feed/ui/ProfileFeedToolbar';
import { UserProfileEmptyState } from './UserProfileEmptyState';
import { FriendsOnlyState } from './FriendsOnlyState';

type Props = {
  profile: PublicProfile;
  friendshipStatus: FriendshipStatus;
};

export const UserProfileFeed = ({ profile, friendshipStatus }: Props) => {
  const { tab, sort, setTab, setSort } = useProfileToolbar();

  const canSeeEvents =
    friendshipStatus === 'friends' || friendshipStatus === 'self';

  const { events, isLoading, isLoadingMore, hasMore, loadMore, error, retry } =
    useProfileEvents({
      userId: profile.user_id,
      tab,
      sort,
      enabled: canSeeEvents,
    });

  const isArchive = tab === 'archive';

  return (
    <EventFeedLayout
      variant="profile"
      toolbar={
        <ProfileFeedToolbar
          activeTab={tab}
          onTabChange={setTab}
          activeSort={sort}
          onSortChange={setSort}
        />
      }
      isLoading={canSeeEvents && isLoading}
      isEmpty={!canSeeEvents || events.length === 0}
      error={error}
      onRetry={retry}
      emptyState={
        !canSeeEvents ? (
          <FriendsOnlyState username={profile.username ?? ''} />
        ) : (
          <UserProfileEmptyState tab={tab} />
        )
      }
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      loadMore={loadMore}
    >
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
    </EventFeedLayout>
  );
};
