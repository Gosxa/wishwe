import { BackendEvent, Paginated } from './types';

const PAGE_SIZE = 20;

export const listEvents = async (): Promise<BackendEvent[]> => {
  const events: BackendEvent[] = [];
  let page: number | null = 1;

  while (page !== null) {
    const res = await fetch(
      `/api/event/events?page=${page}&page_size=${PAGE_SIZE}`,
      { method: 'GET' },
    );

    if (!res.ok) {
      throw new Error('Failed to load events');
    }

    const data: Paginated<BackendEvent> = await res.json();

    events.push(...data.results);

    page = data.next ? page + 1 : null;
  }

  return events;
};

export type {
  BackendEvent,
  BackendEventType,
  MutualFriend,
  Paginated,
} from './types';
