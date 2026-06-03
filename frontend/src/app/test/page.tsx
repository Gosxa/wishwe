import { HomePage } from '@/client_pages';
import { UserStoreInitializer } from '@/shared/store/UserStoreInitializer';
import { Profile } from '@/shared/client_api/auth/types';

const STUB_USER: Profile = {
  id: 1,
  user: 'test@example.com',
  userName: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  bio: null,
  date_of_birth: null,
  city: null,
  gender: null,
  avatar: null,
  social_media_url: null,
};

export default function TestPage() {
  return (
    <>
      <UserStoreInitializer user={STUB_USER} />
      <HomePage />
    </>
  );
}
