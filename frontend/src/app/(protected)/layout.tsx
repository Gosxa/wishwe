import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { authUser } from '@/app/_server/auth/getMe';
import {
  NEXT_PARAM,
  PATHNAME_HEADER,
  safeNextPath,
} from '@/shared/lib/nextPath';
import { UserStoreInitializer } from '@/shared/store/UserStoreInitializer';
import { EventModalHost } from './EventModalHost';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard protected pages, sync user state, and host global modals.
  const user = await authUser();

  if (user && !user.username) {
    const next = safeNextPath((await headers()).get(PATHNAME_HEADER));

    redirect(
      next ? `/onboard?${NEXT_PARAM}=${encodeURIComponent(next)}` : '/onboard',
    );
  }

  return (
    <>
      {user && <UserStoreInitializer user={user} />}
      {children}
      <EventModalHost />
    </>
  );
}
