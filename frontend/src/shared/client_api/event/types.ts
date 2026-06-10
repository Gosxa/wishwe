type BackendEventType = 'wish' | 'plan';

type MutualFriend = {
  id: number;
  username: string;
};

type ParticipantPreview = {
  username: string | null;
  avatar: string | null;
};

type BackendEvent = {
  id: number;
  creator: string | null;
  creator_avatar: string | null;
  mutual_friend: MutualFriend | null;
  category: string | null;
  event_type: BackendEventType;
  event_visibility: string;
  status: string;
  title: string;
  description: string;
  cover_image: string | null;
  location: string;
  external_link: string | null;
  event_date: string | null;
  event_time: string | null;
  timeframe_text: string | null;
  min_participants: number;
  max_participants: number | null;
  participants_count: number;
  interested_count: number;
  participants_preview: ParticipantPreview[];
  created_at: string;
  is_full: boolean;
  available_spots: number | null;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type EventListParams = {
  type?: BackendEventType;
  visible?: string;
  sort?: string;
  title?: string;
  page?: number;
  pageSize?: number;
};

export type {
  BackendEvent,
  BackendEventType,
  EventListParams,
  MutualFriend,
  ParticipantPreview,
  Paginated,
};
