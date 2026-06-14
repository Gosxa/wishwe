import { authUser } from '@/app/_server/auth/getMe';
import { ProfilePage } from '@/client_pages';

export default async function Page() {
  const user = await authUser();

  return <ProfilePage initialUser={user} />;
}
