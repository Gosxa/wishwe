import { BackendEvent, EventListParams, Paginated } from './types';

const PAGE_SIZE = 20;

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
} from './types';
