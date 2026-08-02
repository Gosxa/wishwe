import { cookies } from 'next/headers';

import { beApi } from '@/app/_server/api/backend';
import type { SharedEventResponse } from '@/shared/client_api/event';

export type SharedEventResult =
  | { status: 'ok'; data: SharedEventResponse }
  | { status: 'not-found' }
  | { status: 'unauthorized' };


export const getSharedEvent = async (
  token: string,
): Promise<SharedEventResult> => {
  const cookieStore = await cookies();

  const res = await beApi.event.shared(token, cookieStore.toString());

  if (res.status === 401) return { status: 'unauthorized' };

  if (!res.ok) return { status: 'not-found' };

  return { status: 'ok', data: (await res.json()) as SharedEventResponse };
};
