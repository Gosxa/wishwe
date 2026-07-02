import type { ReactNode } from 'react';
import { ProfileLink } from '@shared/ui/profileLink';
import { UserAvatar } from './UserAvatar';
import s from './personRow.module.scss';

type Props = {
  username: string;
  avatar: string | null;
  name?: string;
  children?: ReactNode;
};

export const PersonRow = ({ username, avatar, name, children }: Props) => (
  <li className={s.row}>
    <UserAvatar src={avatar} alt={username} />
    <div className={s.info}>
      <ProfileLink username={username} className={s.username}>
        @{username}
      </ProfileLink>
      {name && <span className={s.name}>{name}</span>}
    </div>
    {children && <div className={s.action}>{children}</div>}
  </li>
);
