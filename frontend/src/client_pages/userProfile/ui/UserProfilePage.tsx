'use client';

import { Suspense } from 'react';
import type { PublicProfile } from '@/shared/client_api/user/types';
import { Header } from '@widgets/header';
import { Sidebar } from '@widgets/sidebar';
import { useProfileSearch } from '@client_pages/profile/model/useProfileSearch';
import s from '@client_pages/profile/ui/profilePage.module.scss';
import { UserProfileHeader } from './UserProfileHeader';
import { UserProfileFeed } from './UserProfileFeed';

type Props = {
  profile: PublicProfile;
};

export default function UserProfilePage({ profile }: Props) {
  return (
    <Suspense fallback={null}>
      <UserProfilePageContent profile={profile} />
    </Suspense>
  );
}

function UserProfilePageContent({ profile }: Props) {
  const search = useProfileSearch();

  return (
    <div className={s.shell}>
      <Header search={{ ...search, placeholder: 'Search events' }} />
      <div className={s.body}>
        <Sidebar />
        <main className={s.content}>
          <UserProfileHeader profile={profile} />
          <UserProfileFeed profile={profile} />
        </main>
      </div>
    </div>
  );
}
