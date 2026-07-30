import { cache } from 'react';
import { cookies, headers } from 'next/headers';

import { Profile } from '@/shared/client_api/auth/types';
import { USER_ID_HEADER } from '@/shared/lib/nextPath';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

const authUser = cache(async (): Promise<Profile | null> => {
  const headerStore = await headers();
  const cookieStore = await cookies();

  const cookieHeader = headerStore.get('cookie') ?? cookieStore.toString();

  const res = await fetch(`${BACKEND}/api/user/profile/me/`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

  if (!res.ok) return null;

  return res.json();
});

const authUserId = cache(async (): Promise<number | null> => {
  const id = Number((await headers()).get(USER_ID_HEADER));

  return Number.isInteger(id) && id > 0 ? id : null;
});

export { authUser, authUserId };
