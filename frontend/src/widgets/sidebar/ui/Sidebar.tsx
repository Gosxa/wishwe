'use client';

import { useUserStore } from '@/shared/store/useUserStore';
import { navConfig } from '../model/navConfig';
import { NavItem } from './NavItem';
import s from '../sidebar.module.scss';

type Props = {
  activeKey?: string;
};

export const Sidebar = ({ activeKey }: Props) => {
  const avatar = useUserStore(state => state.user?.avatar) ?? null;

  return (
    <nav className={s.sidebar}>
      {navConfig.map(item => (
        <NavItem
          key={item.key}
          Icon={item.Icon}
          label={item.label}
          href={item.href}
          isActive={item.key === activeKey}
          avatarUrl={item.key === 'profile' ? avatar : null}
        />
      ))}
    </nav>
  );
};
