'use client';

import type {
  FriendshipStatus,
  PublicProfile,
} from '@/shared/client_api/user/types';
import { AvatarImage } from '@shared/ui/avatarImage/AvatarImage';
import s from '@client_pages/profile/widgets/profileHeader/ui/profileHeader.module.scss';
import { UserProfileAbout } from './UserProfileAbout';
import { UserProfileFriendButton } from './UserProfileFriendButton';
import u from './userProfileHeader.module.scss';

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
          {profile.is_banned ? (
            <>
              <h1 className={s.username}>Banned user</h1>
              <p className={s.bannedNotice}>
                This profile was restricted for violating the platform rules.
              </p>
            </>
          ) : (
            <>
              <div className={u.nameRow}>
                {username && <h1 className={s.username}>@{username}</h1>}
                <UserProfileAbout profile={profile} />
              </div>
              {bio && <p className={s.bio}>{bio}</p>}
            </>
          )}

          {!profile.is_banned && (
            <UserProfileFriendButton
              userId={profile.user_id}
              username={username}
              status={friendshipStatus}
              onStatusChange={onFriendshipStatusChange}
            />
          )}
        </div>
      </div>
    </section>
  );
};
