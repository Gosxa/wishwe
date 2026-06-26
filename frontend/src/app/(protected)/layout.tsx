import { redirect } from 'next/navigation';

import { authUser } from '@/app/_server/auth/getMe';
import { UserStoreInitializer } from '@/shared/store/UserStoreInitializer';
import { EventModalHost } from './EventModalHost';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await authUser();

  if (user && !user.username) redirect('/onboard');

  return (
    <>
      {user && <UserStoreInitializer user={user} />}
      {children}
      <EventModalHost />
    </>
  );
}
