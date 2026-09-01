'use client';

import Link from 'next/link';
import type { Profile } from '@/shared/client_api/auth/types';
import { Pencil } from '@shared/ui/icons';
import { AvatarImage } from '@shared/ui/avatarImage/AvatarImage';
import { useUserStore } from '@/shared/store/useUserStore';
import { InviteFriends } from './InviteFriends';
import { ProfileStats } from './ProfileStats';
import s from './profileHeader.module.scss';

type Props = {
  initialUser: Profile | null;
};

export const ProfileHeader = ({ initialUser }: Props) => {
  const user = useUserStore(state => state.user) ?? initialUser;

  const username = user?.username ?? '';
  const bio = user?.bio ?? '';
  const avatar = user?.avatar ?? null;
  const activeCount =
    user?.active_events_count ?? initialUser?.active_events_count;
  const archivedCount =
    user?.archived_events_count ?? initialUser?.archived_events_count;
  const hasStats = activeCount != null || archivedCount != null;

  return (
    <section className={s.header}>
      <div className={s.identity}>
        <span className={`${s.avatar}${avatar ? ` ${s.avatarUploaded}` : ''}`}>
          <AvatarImage
            src={avatar}
            alt={username}
            fallbackWidth={72}
            fallbackHeight={72}
          />
        </span>

        <div className={s.identityBody}>
          {username && <h1 className={s.username}>@{username}</h1>}
          {bio && <p className={s.bio}>{bio}</p>}

          {hasStats && (
            <ProfileStats
              activeCount={activeCount ?? 0}
              archivedCount={archivedCount ?? 0}
            />
          )}

          <Link href="/edit-profile" className={s.editButton}>
            <Pencil />
            <span>Edit profile</span>
          </Link>
        </div>
      </div>

      <InviteFriends />
    </section>
  );
};
