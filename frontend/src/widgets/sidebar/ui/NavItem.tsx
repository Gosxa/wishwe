import clsx from 'clsx';
import type { ComponentType } from 'react';
import s from '../sidebar.module.scss';

type Props = {
  Icon: ComponentType;
  label: string;
  isActive?: boolean;
};

export const NavItem = ({ Icon, label, isActive }: Props) => (
  <div className={clsx(s.navItem, isActive && s.active)}>
    <Icon />
    <span className={s.label}>{label}</span>
  </div>
);
