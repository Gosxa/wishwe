import { authUser } from '@/app/_server/auth/getMe';
import { UserStoreInitializer } from '@/shared/store/UserStoreInitializer';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await authUser();

  return (
    <>
      {user && <UserStoreInitializer user={user} />}
      {children}
    </>
  );
}
