import { cookies } from 'next/headers';

import { Profile } from '@/shared/api/user';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

const authUser = async (): Promise<Profile | null> => {
  const cookieStore = await cookies();

  const res = await fetch(`${BACKEND}/api/user/profile/me/`, {
    headers: { cookie: cookieStore.toString() },
    cache: 'no-store',
  });

  if (!res.ok) return null;

  return res.json();
};

export { authUser };
