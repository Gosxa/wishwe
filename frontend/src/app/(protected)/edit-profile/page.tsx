import { authUser } from '@/app/_server/auth/getMe';
import { EditProfilePage } from '@/client_pages';

export default async function Page() {
  const user = await authUser();

  return <EditProfilePage initialUser={user} />;
}
