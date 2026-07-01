import {
  BackendEvent,
  BackendEventType,
  BackendParticipant,
  Category,
  EventListParams,
  Paginated,
} from './types';

const PAGE_SIZE = 5;

const postAction = async (
  id: string,
  action: string,
): Promise<BackendEvent> => {
  const res = await fetch(`/api/event/events/${id}/${action}/`, {
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

export const archiveEvent = async (id: string): Promise<void> => {
  const res = await fetch(`/api/event/events/${id}/archive_plan/`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Failed to archive event');
  }
};

export const getEvent = async (id: string): Promise<BackendEvent> => {
  const res = await fetch(`/api/event/events/${id}`, { method: 'GET' });

  if (!res.ok) {
    throw new Error('Failed to load event');
  }

  return (await res.json()) as BackendEvent;
};

export const listParticipants = async (
  id: string,
): Promise<BackendParticipant[]> => {
  const res = await fetch(`/api/event/events/${id}/participants/`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error('Failed to load participants');
  }

  return (await res.json()) as BackendParticipant[];
};

export const listCategories = async (): Promise<Category[]> => {
  const res = await fetch('/api/event/category', { method: 'GET' });

  if (!res.ok) {
    throw new Error('Failed to load categories');
  }

  return (await res.json()) as Category[];
};

export class CreateEventError extends Error {
  constructor(public body: Record<string, unknown>) {
    super('Failed to create event');
  }
}

export const createEvent = async (
  type: BackendEventType,
  payload: FormData | Record<string, unknown>,
): Promise<BackendEvent> => {
  const isFormData = payload instanceof FormData;

  if (isFormData) {
    payload.set('type', type);
  }

  const res = await fetch('/next_api/event', {
    method: 'POST',
    ...(isFormData
      ? { body: payload }
      : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, type }),
        }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    throw new CreateEventError(body);
  }

  return (await res.json()) as BackendEvent;
};

export class UpdateEventError extends Error {
  constructor(public body: Record<string, unknown>) {
    super('Failed to update event');
  }
}

export const updateEvent = async (
  id: string,
  type: BackendEventType,
  payload: FormData | Record<string, unknown>,
): Promise<BackendEvent> => {
  const isFormData = payload instanceof FormData;

  if (isFormData) {
    payload.set('type', type);
  }

  const res = await fetch(`/next_api/event/${id}`, {
    method: 'PATCH',
    ...(isFormData
      ? { body: payload }
      : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, type }),
        }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    throw new UpdateEventError(body);
  }

  return (await res.json()) as BackendEvent;
};

export class ConvertEventError extends Error {
  constructor(public body: Record<string, unknown>) {
    super('Failed to convert wish to plan');
  }
}

export type ConvertToPlanPayload = {
  event_date: string;
  event_time: string;
  min_participants: number;
  max_participants: number;
};

export const convertToPlan = async (
  id: string,
  payload: ConvertToPlanPayload,
): Promise<BackendEvent> => {
  const res = await fetch(`/next_api/event/${id}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    throw new ConvertEventError(body);
  }

  return (await res.json()) as BackendEvent;
};

export type {
  BackendEvent,
  BackendEventType,
  BackendParticipant,
  Category,
  EventListParams,
  MutualFriend,
  Paginated,
  UserParticipationStatus,
} from './types';
