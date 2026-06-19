'use client';

import Link from 'next/link';

import { useInviteContext } from '@/client_pages/onboard/model';
import { toAbsoluteMediaUrl } from '@/client_pages/home/model/feedMapper';
import { useUserStore } from '@/shared/store/useUserStore';
import { Avatar } from '@shared/ui/icons';

import s from './inviteRequestSent.module.scss';

export const InviteRequestSentContent = () => {
  const invite = useInviteContext();
  const user = useUserStore(s => s.user);

  const inviterAvatar = invite?.avatar ?? null;
  const userAvatar = user?.avatar
    ? (toAbsoluteMediaUrl(user.avatar) ?? user.avatar)
    : null;

  return (
    <div className={s.wrapper}>
      <div className={s.avatarGroup}>
        <div
          className={`${s.avatarLeft}${userAvatar ? ` ${s.avatarUploaded}` : ''}`}
        >
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userAvatar} alt="Your profile" />
          ) : (
            <Avatar width={80} height={80} />
          )}
        </div>
        <div className={s.avatarRight}>
          {inviterAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={inviterAvatar} alt="Inviter profile" />
          ) : (
            <Avatar width={80} height={80} />
          )}
        </div>
      </div>
      <div className={s.contentStack}>
        <div className={s.textStack}>
          <h2 className={s.screenTitle}>Request sent!</h2>
          <p className={s.screenHeadline}>
            You&apos;ve sent a friend request. Hang tight until they accept it.
          </p>
        </div>
        <Link href="/feed" className={s.primary}>
          <span>Go to feed</span>
        </Link>
      </div>
    </div>
  );
};
