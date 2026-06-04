export type EventType = 'plan' | 'wish';

export type FeedFilter = 'all' | 'plans' | 'wishes';

export type FeedReach = 'all' | 'direct';

export type SortOption = 'soonest' | 'recent' | 'heat';

export type EventHost = {
  username: string;
  /** Set when the host is reachable through a mutual friend. */
  mutualFriend?: string;
};

export type FeedEvent = {
  id: string;
  type: EventType;
  hashtag?: string;
  image: string;
  title: string;
  host: EventHost;
  date: string;
  startsAt: number | null;
  createdAt: number;
  location: string;
  description?: string;
  participantCount: number;
};
