'use client';

import { Suspense, useState } from 'react';
import type {
  FriendshipStatus,
  PublicProfile,
} from '@/shared/client_api/user/types';
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
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>(
    profile.friendship_status,
  );

  return (
    <div className={s.shell}>
      <Header search={{ ...search, placeholder: 'Search events' }} />
      <div className={s.body}>
        <Sidebar />
        <main className={s.content}>
          <UserProfileHeader
            profile={profile}
            friendshipStatus={friendshipStatus}
            onFriendshipStatusChange={setFriendshipStatus}
          />
          <UserProfileFeed
            profile={profile}
            friendshipStatus={friendshipStatus}
          />
        </main>
      </div>
    </div>
  );
}
