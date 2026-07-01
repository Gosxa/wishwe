import type { ReactNode } from 'react';
import { ProfileLink } from '@shared/ui/profileLink';
import { UserAvatar } from './UserAvatar';
import s from './personRow.module.scss';

type Props = {
  username: string;
  avatar: string | null;
  children?: ReactNode;
};

export const PersonRow = ({ username, avatar, children }: Props) => (
  <li className={s.row}>
    <UserAvatar src={avatar} alt={username} />
    <ProfileLink username={username} className={s.username}>
      @{username}
    </ProfileLink>
    {children && <div className={s.action}>{children}</div>}
  </li>
);
