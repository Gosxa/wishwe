export type EventType = 'plan' | 'wish';

export type EventHost = {
  username: string;
  avatar: string | null;
  mutualFriend?: string;
};

export type ParticipantAvatar = {
  username: string;
  avatar: string | null;
};

export type FeedEvent = {
  id: string;
  type: EventType;
  hashtag?: string;
  image: string | null;
  title: string;
  host: EventHost;
  date: string;
  startsAt: number | null;
  createdAt: number;
  location: string;
  description?: string;
  chatLink: string | null;
  participantCount: number;
  maxParticipants: number | null;
  participants: ParticipantAvatar[];
  userParticipationStatus: 'joined' | 'interested' | null;
};

export type FeedFilter = 'all' | 'plans' | 'wishes';

export type FeedReach = 'all' | 'direct';

export type SortOption = 'soonest' | 'recent' | 'heat';
