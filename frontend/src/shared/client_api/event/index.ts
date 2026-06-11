import { BackendEvent, EventListParams, Paginated } from './types';

const PAGE_SIZE = 20;

const postAction = async (
  id: string,
  action: string,
): Promise<BackendEvent> => {
  const res = await fetch(`/api/event/events/${id}/${action}`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error(`Failed to ${action}`);
  }

  return (await res.json()) as BackendEvent;
};

export const joinPlan = (id: string) => postAction(id, 'join_plan');

export const expressInterest = (id: string) =>
  postAction(id, 'interested_in_wish');

export const leaveEvent = (id: string) => postAction(id, 'leave_event');

export const listEvents = async (
  params: EventListParams = {},
): Promise<Paginated<BackendEvent>> => {
  const { type, visible, sort, title, page = 1, pageSize = PAGE_SIZE } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('page_size', String(pageSize));

  if (type) query.set('type', type);
  if (visible) query.set('visible', visible);
  if (sort) query.set('sort', sort);
  if (title) query.set('title', title);

  const res = await fetch(`/api/event/events?${query.toString()}`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error('Failed to load events');
  }

  return (await res.json()) as Paginated<BackendEvent>;
};

export type {
  BackendEvent,
  BackendEventType,
  EventListParams,
  MutualFriend,
  Paginated,
  UserParticipationStatus,
} from './types';
