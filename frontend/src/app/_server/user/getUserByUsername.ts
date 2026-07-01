import { cookies } from 'next/headers';

import { PublicProfile } from '@/shared/client_api/user/types';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

/**
 * Resolve a public profile by its exact username.
 * Returns null when the user is not found or is private (backend returns 404).
 */
export const getUserByUsername = async (
  username: string,
): Promise<PublicProfile | null> => {
  const cookieStore = await cookies();

  const res = await fetch(
    `${BACKEND}/api/user/profile/by-username/${encodeURIComponent(username)}/`,
    {
      headers: { cookie: cookieStore.toString() },
      cache: 'no-store',
    },
  );

  if (!res.ok) return null;

  return res.json();
};
