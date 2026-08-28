import clsx from 'clsx';
import Link from 'next/link';
import type { ComponentType, Ref } from 'react';
import { AvatarImage } from '@shared/ui/avatarImage/AvatarImage';
import s from '../sidebar.module.scss';

type Props = {
  Icon: ComponentType;
  label: string;
  href: string;
  isActive?: boolean;
  avatarUrl?: string | null;
  tourId?: string;
  itemRef?: Ref<HTMLAnchorElement>;
};

export const NavItem = ({
  Icon,
  label,
  href,
  isActive,
  avatarUrl,
  tourId,
  itemRef,
}: Props) => (
  <Link
    ref={itemRef}
    href={href}
    data-tour={tourId}
    className={clsx(s.navItem, isActive && s.active)}
    aria-current={isActive ? 'page' : undefined}
  >
    {avatarUrl ? (
      <AvatarImage
        className={s.avatar}
        src={avatarUrl}
        alt={label}
        fallbackWidth={24}
        fallbackHeight={24}
      />
    ) : (
      <Icon />
    )}
    <span className={s.label}>{label}</span>
  </Link>
);
