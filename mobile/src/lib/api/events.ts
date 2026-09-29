import { apiRequest } from '@/lib/api/client';

export type BackendEventType = 'wish' | 'plan';

export type UserParticipationStatus = 'joined' | 'interested';

export type MutualFriend = {
  id: number;
  username: string;
};

export type ParticipantPreview = {
  username: string | null;
  avatar: string | null;
};

export type BackendEvent = {
  id: number;
  uuid: string;
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
  location_place_id?: string | null;
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
  user_participation_status: UserParticipationStatus | null;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type EventListParams = {
  type?: BackendEventType;
  visible?: string;
  sort?: string;
  title?: string;
  page?: number;
  pageSize?: number;
};

const PAGE_SIZE = 10;

export function listEvents(params: EventListParams = {}): Promise<Paginated<BackendEvent>> {
  const { type, visible, sort, title, page = 1, pageSize = PAGE_SIZE } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('page_size', String(pageSize));

  if (type) query.set('type', type);
  if (visible) query.set('visible', visible);
  if (sort) query.set('sort', sort);
  if (title) query.set('title', title);

  return apiRequest<Paginated<BackendEvent>>(`/api/event/events/?${query.toString()}`, {
    auth: true,
  });
}

export function getEvent(id: string): Promise<BackendEvent> {
  return apiRequest<BackendEvent>(`/api/event/events/${id}/`, { auth: true });
}

export function listParticipants(id: string): Promise<ParticipantPreview[]> {
  return apiRequest<ParticipantPreview[]>(`/api/event/events/${id}/participants/`, { auth: true });
}

function postAction(id: string, action: string): Promise<BackendEvent> {
  return apiRequest<BackendEvent>(`/api/event/events/${id}/${action}/`, {
    method: 'POST',
    auth: true,
  });
}

export const joinPlan = (id: string) => postAction(id, 'join_plan');

export const expressInterest = (id: string) => postAction(id, 'interested_in_wish');

export const leaveEvent = (id: string) => postAction(id, 'leave_event');
