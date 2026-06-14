'use client';

import Link from 'next/link';
import type { Profile } from '@/shared/client_api/auth/types';
import { Avatar, Pencil } from '@shared/ui/icons';
import { useUserStore } from '@/shared/store/useUserStore';
import { InviteFriends } from './InviteFriends';
import s from './profileHeader.module.scss';

type Props = {
  initialUser: Profile | null;
};

export const ProfileHeader = ({ initialUser }: Props) => {
  // Prefer the live store (picks up in-session edits) but fall back to the
  // server-fetched user, so the identity renders during SSR instead of flashing
  // empty while the client store hydrates — most visible on slow connections.
  const user = useUserStore(state => state.user) ?? initialUser;

  const username = user?.username ?? '';
  const bio = user?.bio ?? '';
  const avatar = user?.avatar ?? null;

  return (
    <section className={s.header}>
      <div className={s.identity}>
        <span className={s.avatar}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={username} />
          ) : (
            <Avatar width={72} height={72} />
          )}
        </span>

        <div className={s.identityBody}>
          {username && <h1 className={s.username}>@{username}</h1>}
          {bio && <p className={s.bio}>{bio}</p>}

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
