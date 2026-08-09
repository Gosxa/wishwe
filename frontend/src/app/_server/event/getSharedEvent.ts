import { cookies, headers } from 'next/headers';

import { beApi } from '@/app/_server/api/backend';
import type { SharedEventResponse } from '@/shared/client_api/event';

export type SharedEventResult =
  | { status: 'ok'; data: SharedEventResponse }
  | { status: 'not-found' }
  | { status: 'unauthorized' };

type GetSharedEventOptions = {
  includeCredentials: boolean;
};

export const getSharedEvent = async (
  token: string,
  { includeCredentials }: GetSharedEventOptions,
): Promise<SharedEventResult> => {
  let cookieHeader: string | undefined;

  if (includeCredentials) {
    const forwardedCookieHeader = (await headers()).get('cookie');

    cookieHeader = forwardedCookieHeader ?? (await cookies()).toString();
  }

  const res = await beApi.event.shared(token, cookieHeader);

  if (res.status === 401) return { status: 'unauthorized' };

  if (!res.ok) return { status: 'not-found' };

  return { status: 'ok', data: (await res.json()) as SharedEventResponse };
};
