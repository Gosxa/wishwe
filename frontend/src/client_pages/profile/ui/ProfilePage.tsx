'use client';

import { Suspense } from 'react';
import type { Profile } from '@/shared/client_api/auth/types';
import { Header } from '@widgets/header';
import { Sidebar } from '@widgets/sidebar';
import { useProfileSearch } from '@client_pages/profile/model/useProfileSearch';
import { ProfileFeed } from '../widgets/feed';
import { ProfileHeader } from '../widgets/profileHeader';
import s from './profilePage.module.scss';

type Props = {
  initialUser: Profile | null;
};

export default function ProfilePage({ initialUser }: Props) {
  // useProfileSearch reads the URL via useSearchParams, which must sit under a
  // Suspense boundary so the page can prerender.
  return (
    <Suspense fallback={null}>
      <ProfilePageContent initialUser={initialUser} />
    </Suspense>
  );
}

function ProfilePageContent({ initialUser }: Props) {
  const search = useProfileSearch();

  return (
    <div className={s.shell}>
      <Header search={{ ...search, placeholder: 'Search my events' }} />
      <div className={s.body}>
        <Sidebar activeKey="profile" />
        <main className={s.content}>
          <ProfileHeader initialUser={initialUser} />
          <ProfileFeed initialUser={initialUser} />
        </main>
      </div>
    </div>
  );
}
