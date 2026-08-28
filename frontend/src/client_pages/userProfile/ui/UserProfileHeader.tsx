'use client';

import type {
  FriendshipStatus,
  PublicProfile,
} from '@/shared/client_api/user/types';
import { AvatarImage } from '@shared/ui/avatarImage/AvatarImage';
import s from '@client_pages/profile/widgets/profileHeader/ui/profileHeader.module.scss';
import { UserProfileFriendButton } from './UserProfileFriendButton';

type Props = {
  profile: PublicProfile;
  friendshipStatus: FriendshipStatus;
  onFriendshipStatusChange: (status: FriendshipStatus) => void;
};

export const UserProfileHeader = ({
  profile,
  friendshipStatus,
  onFriendshipStatusChange,
}: Props) => {
  const username = profile.username ?? '';
  const bio = profile.bio ?? '';
  const avatar = profile.avatar ?? null;

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

          <UserProfileFriendButton
            userId={profile.user_id}
            username={username}
            status={friendshipStatus}
            onStatusChange={onFriendshipStatusChange}
          />
        </div>
      </div>
    </section>
  );
};
