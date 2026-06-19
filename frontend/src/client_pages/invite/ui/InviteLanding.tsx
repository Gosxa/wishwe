import Link from 'next/link';

import { AuthLayout } from '@/shared';
import { Avatar } from '@shared/ui/icons';
import s from './inviteLanding.module.scss';

type Props = {
  token: string;
  username?: string;
  avatarSrc?: string | null;
};

const getInviteHandle = (username?: string) =>
  username ? `@${username.replace(/^@/, '')}` : '[@username]';

export const InviteLanding = ({ token, username, avatarSrc }: Props) => {
  const inviteHandle = getInviteHandle(username);
  const joinHref = `/invite/${encodeURIComponent(token)}/join`;

  return (
    <AuthLayout>
      <section className={s.landing}>
        <div className={s.card}>
          <div className={s.avatar}>
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt={`${inviteHandle} profile`} />
            ) : (
              <Avatar width={80} height={80} />
            )}
          </div>
          <div className={s.content}>
            <div className={s.primaryGroup}>
              <div className={s.headingGroup}>
                <h1>See what {inviteHandle} is planning next</h1>
                <p>See their plans, share your wishes, and get together.</p>
              </div>
              <Link href={joinHref} className={s.primary}>
                <span>Join</span>
              </Link>
            </div>
            <Link href="/onboard" className={s.tertiary}>
              <span>Explore the app</span>
            </Link>
          </div>
        </div>
      </section>
    </AuthLayout>
  );
};
