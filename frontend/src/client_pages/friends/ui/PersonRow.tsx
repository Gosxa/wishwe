import clsx from 'clsx';
import type { ReactNode } from 'react';
import { ProfileLink } from '@shared/ui/profileLink';
import { UserAvatar } from './UserAvatar';
import s from './personRow.module.scss';

type Props = {
  username: string;
  avatar: string | null;
  name?: string;
  stackActions?: boolean;
  children?: ReactNode;
};

export const PersonRow = ({
  username,
  avatar,
  name,
  stackActions = false,
  children,
}: Props) => (
  <li className={clsx(s.row, stackActions && s.rowStacked)}>
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
