import clsx from 'clsx';
import Link from 'next/link';
import type { ComponentType } from 'react';
import s from '../sidebar.module.scss';

type Props = {
  Icon: ComponentType;
  label: string;
  href: string;
  isActive?: boolean;
  avatarUrl?: string | null;
};

export const NavItem = ({ Icon, label, href, isActive, avatarUrl }: Props) => (
  <Link
    href={href}
    className={clsx(s.navItem, isActive && s.active)}
    aria-current={isActive ? 'page' : undefined}
  >
    {avatarUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={s.avatar} src={avatarUrl} alt={label} />
    ) : (
      <Icon />
    )}
    <span className={s.label}>{label}</span>
  </Link>
);
