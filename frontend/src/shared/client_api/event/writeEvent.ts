import { handleUnauthorized } from '@/shared/client_api/handleResponse';
import type { BackendEvent, BackendEventType } from './types';

type EventPayload = FormData | Record<string, unknown>;
type EventWriteErrorFactory = (body: Record<string, unknown>) => Error;

const prepareEventPayload = (
  type: BackendEventType,
  payload: EventPayload,
): Pick<RequestInit, 'body' | 'headers'> => {
  if (payload instanceof FormData) {
    payload.set('type', type);

    return { body: payload };
  }

  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, type }),
  };
};

export const writeEvent = async (
  endpoint: string,
  method: 'POST' | 'PATCH',
  type: BackendEventType,
  payload: EventPayload,
  createError: EventWriteErrorFactory,
): Promise<BackendEvent> => {
  const res = await fetch(endpoint, {
    method,
    ...prepareEventPayload(type, payload),
  });

  if (!res.ok) {
    handleUnauthorized(res);
    const body = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    throw createError(body);
  }

  return (await res.json()) as BackendEvent;
};
