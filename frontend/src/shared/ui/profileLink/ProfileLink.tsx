'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useUserStore } from '@/shared/store/useUserStore';
import s from './profileLink.module.scss';

type Props = {
  /** Username with or without a leading "@". */
  username: string | null | undefined;
  className?: string;
  children: ReactNode;
};

export const ProfileLink = ({ username, className, children }: Props) => {
  const currentUsername = useUserStore(state => state.user?.username);
  const handle = (username ?? '').replace(/^@/, '').trim();

  if (!handle) {
    return <span className={className}>{children}</span>;
  }

  const isSelf =
    !!currentUsername && currentUsername.toLowerCase() === handle.toLowerCase();
  const href = isSelf ? '/profile' : `/user/${encodeURIComponent(handle)}`;

  return (
    <Link href={href} className={clsx(s.link, className)}>
      {children}
    </Link>
  );
};
